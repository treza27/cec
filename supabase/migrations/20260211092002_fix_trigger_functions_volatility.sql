/*
  # Fix Trigger Functions Volatility
  
  1. Problem
    - Trigger functions were incorrectly marked as IMMUTABLE in previous migration
    - This causes "UPDATE is not allowed in a non-volatile function" error
    - Trigger functions that modify data must be VOLATILE, not IMMUTABLE
  
  2. Changes
    - Change all trigger functions from IMMUTABLE back to VOLATILE
    - This includes functions that update timestamps and sync data
  
  3. Functions Fixed
    - update_depart_updated_at()
    - clean_inventaire_data()
    - update_package_images_updated_at()
    - update_clients_updated_at()
    - update_client_shipping_marks_updated_at()
    - sync_client_info_to_shipping_marks()
    - update_updated_at_column()
*/

-- Fix update_depart_updated_at function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_depart_updated_at') THEN
    ALTER FUNCTION update_depart_updated_at() VOLATILE;
  END IF;
END $$;

-- Fix clean_inventaire_data function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'clean_inventaire_data') THEN
    ALTER FUNCTION clean_inventaire_data() VOLATILE;
  END IF;
END $$;

-- Fix update_package_images_updated_at function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_package_images_updated_at') THEN
    ALTER FUNCTION update_package_images_updated_at() VOLATILE;
  END IF;
END $$;

-- Fix update_clients_updated_at function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_clients_updated_at') THEN
    ALTER FUNCTION update_clients_updated_at() VOLATILE;
  END IF;
END $$;

-- Fix update_client_shipping_marks_updated_at function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_client_shipping_marks_updated_at') THEN
    ALTER FUNCTION update_client_shipping_marks_updated_at() VOLATILE;
  END IF;
END $$;

-- Fix sync_client_info_to_shipping_marks function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_client_info_to_shipping_marks') THEN
    ALTER FUNCTION sync_client_info_to_shipping_marks() VOLATILE;
  END IF;
END $$;

-- Fix update_updated_at_column function
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    ALTER FUNCTION update_updated_at_column() VOLATILE;
  END IF;
END $$;