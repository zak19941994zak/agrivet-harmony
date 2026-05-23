-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'accountant', 'cashier', 'warehouse');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- security definer: avoid recursive RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- trigger: auto profile + first user = owner, others = cashier
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
  assigned_role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count <= 1 THEN
    assigned_role := 'owner';
  ELSE
    assigned_role := 'cashier';
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- profiles policies
CREATE POLICY "staff_read_profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "user_update_own_profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- user_roles policies
CREATE POLICY "staff_read_roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "owner_manage_roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_read_categories" ON public.categories FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "managers_write_categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'));

-- ============ PRODUCTS ============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  barcode TEXT UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  unit TEXT NOT NULL DEFAULT 'قطعة',
  stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  cost NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  wholesale_price NUMERIC,
  expiry DATE,
  batch_no TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE POLICY "staff_read_products" ON public.products FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "managers_write_products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse'));

-- ============ CUSTOMERS ============
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  type TEXT DEFAULT 'individual', -- individual | farm | clinic
  balance NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_read_customers" ON public.customers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff_write_customers" ON public.customers FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ SUPPLIERS ============
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  balance NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_read_suppliers" ON public.suppliers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "managers_write_suppliers" ON public.suppliers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse') OR public.has_role(auth.uid(),'accountant'));

-- ============ INVOICES ============
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no SERIAL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  cashier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_type TEXT NOT NULL DEFAULT 'cash', -- cash | transfer | credit
  status TEXT NOT NULL DEFAULT 'paid', -- paid | draft | returned
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_invoices_created ON public.invoices(created_at DESC);
CREATE POLICY "staff_read_invoices" ON public.invoices FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff_create_invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "managers_update_invoices" ON public.invoices FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));

CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  qty NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  total NUMERIC NOT NULL
);
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE POLICY "staff_read_invoice_items" ON public.invoice_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff_write_invoice_items" ON public.invoice_items FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ============ PURCHASES ============
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_no SERIAL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'received',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_read_purchases" ON public.purchases FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "managers_write_purchases" ON public.purchases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'warehouse') OR public.has_role(auth.uid(),'accountant'));

-- ============ EXPENSES ============
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_read_expenses" ON public.expenses FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "accountants_write_expenses" ON public.expenses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info', -- info | warning | danger | success
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_read_notifications" ON public.notifications FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff_update_notifications" ON public.notifications FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));

-- ============ ACTIVITY LOGS ============
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "managers_read_logs" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "staff_write_logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER products_touch_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();