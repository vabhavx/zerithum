-- Enforce platform connection limits via database trigger
-- Prevents users from exceeding their subscription entitlements
-- This prevents API bypasses (e.g., direct REST API inserts bypassing the edge function)

CREATE OR REPLACE FUNCTION public.check_platform_entitlement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    max_allowed INTEGER;
    current_count INTEGER;
BEGIN
    -- Get the user's entitlement limit
    SELECT COALESCE(max_platforms, 0) INTO max_allowed
    FROM public.entitlements
    WHERE user_id = NEW.user_id;

    -- Default to 0 if no entitlement row exists
    IF max_allowed IS NULL THEN
        max_allowed := 0;
    END IF;

    -- Count existing connections for this user
    SELECT COUNT(*) INTO current_count
    FROM public.connected_platforms
    WHERE user_id = NEW.user_id;

    -- Block insertion if limit is exceeded
    IF current_count >= max_allowed THEN
        RAISE EXCEPTION 'Platform limit reached. Please upgrade your subscription to connect more platforms.'
            USING ERRCODE = 'P0001', DETAIL = format('User %s has %s connections, limit is %s', NEW.user_id, current_count, max_allowed);
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger on connected_platforms to enforce entitlements on INSERT
CREATE TRIGGER enforce_platform_entitlement
BEFORE INSERT ON public.connected_platforms
FOR EACH ROW EXECUTE FUNCTION public.check_platform_entitlement();
