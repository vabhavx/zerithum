import {
  Youtube,
  Users,
  CircleDollarSign,
  ShoppingBag,
  Music,
  Store,
  Tv,
  FileText
} from "lucide-react";

export const PLATFORMS = [
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "bg-red-500/10 border-red-500/20 text-red-400",
    description: "Track ad revenue, memberships, and Super Chat earnings",
    oauthUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scope: "https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.readonly",
    redirectUri: "https://zerithum.com/authcallback",
    requiresApiKey: false,
    clientId: "985180453886-jld5u3u1nethrpaqk6o1tbvqhf1nlueb.apps.googleusercontent.com"
  },
  {
    id: "patreon",
    name: "Patreon",
    icon: Users,
    color: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    description: "Sync pledges, membership tiers, and patron data",
    oauthUrl: "https://www.patreon.com/oauth2/authorize",
    scope: "identity identity[email] campaigns campaigns.members",
    redirectUri: "https://zerithum.com/authcallback",
    requiresApiKey: false,
    clientId: "i1ircOfqA2eD5ChN4-d6uElxt4vjWzIEv4vCfj0K_92LqilSM5OA_dJS24uFjiTR"
  },
  {
    id: "gumroad",
    name: "Gumroad",
    icon: ShoppingBag,
    color: "bg-pink-500/10 border-pink-500/20 text-pink-400",
    description: "Import product sales, subscriptions, and license data",
    oauthUrl: "https://gumroad.com/oauth/authorize",
    scope: "view_sales",
    redirectUri: "https://zerithum.com/authcallback",
    requiresApiKey: false,
    clientId: "CFsL3oJtRheXNoxJgMNoJQnh1XZ9FLU7802HoBRwbpU"
  },
  {
    id: "stripe",
    name: "Stripe",
    icon: CircleDollarSign,
    color: "bg-zteal-400/10 border-zteal-400/20 text-zteal-400",
    description: "Connect payments, subscriptions, and payout data",
    oauthUrl: "https://connect.stripe.com/oauth/authorize",
    scope: "read_write",
    redirectUri: "https://zerithum.com/authcallback",
    requiresApiKey: false,
    clientId: import.meta.env.VITE_STRIPE_CLIENT_ID || "YOUR_STRIPE_CLIENT_ID"
  },

  {
    id: "tiktok",
    name: "TikTok",
    icon: Music,
    color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    description: "Track Creator Fund earnings and video insights",
    oauthUrl: "https://www.tiktok.com/v2/auth/authorize/",
    scope: "video.list,user.info.basic,video.insights",
    redirectUri: "https://zerithum.com/authcallback",
    requiresApiKey: false,
    clientKey: import.meta.env.VITE_TIKTOK_CLIENT_KEY || "YOUR_TIKTOK_CLIENT_KEY"
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: Store,
    color: "bg-green-500/10 border-green-500/20 text-green-400",
    description: "Sync store sales, orders, and product revenue",
    // oauthUrl is built dynamically from the shop name entered by the user
    oauthUrl: "https://SHOP.myshopify.com/admin/oauth/authorize",
    scope: "read_analytics,read_app_proxy,read_assigned_fulfillment_orders,read_audit_events,read_validations,read_cash_tracking,read_channels,read_checkout_branding_settings,read_checkouts,read_custom_fulfillment_services,read_custom_pixels,read_customers,read_customer_data_erasure,read_customer_merge,read_delivery_customizations,read_price_rules,read_discounts,read_discounts_allocator_functions,read_discovery,read_draft_orders,read_files,read_fulfillment_constraint_rules,read_fulfillments,read_gift_card_transactions,read_gift_cards,read_inventory,read_inventory_shipments,read_inventory_shipments_received_items,read_inventory_transfers,read_legal_policies,read_delivery_option_generators,read_locales,read_locations,read_marketing_integrated_campaigns,read_marketing_events,read_markets,read_markets_home,read_merchant_managed_fulfillment_orders,read_metaobject_definitions,read_metaobjects,read_online_store_navigation,read_online_store_pages,read_payment_terms,read_payment_customizations,read_product_feeds,read_product_listings,read_products,read_publications,read_purchase_options,read_reports,read_resource_feedbacks,read_returns,read_script_tags,read_shopify_payments_provider_accounts_sensitive,read_shipping,read_shopify_payments_accounts,read_shopify_payments_payouts,read_shopify_payments_bank_accounts,read_shopify_payments_disputes,read_content,read_store_credit_account_transactions,read_store_credit_accounts,read_third_party_fulfillment_orders,read_translations,customer_read_companies,customer_read_customers,customer_read_draft_orders,customer_read_markets,customer_read_metaobjects,customer_read_orders,customer_read_quick_sale,customer_read_store_credit_account_transactions,customer_read_store_credit_accounts,unauthenticated_read_bulk_operations,unauthenticated_read_bundles,unauthenticated_read_checkouts,unauthenticated_read_customers,unauthenticated_read_customer_tags,unauthenticated_read_metaobjects,unauthenticated_read_product_pickup_locations,unauthenticated_read_product_inventory,unauthenticated_read_product_listings,unauthenticated_read_product_tags,unauthenticated_read_selling_plans",
    redirectUri: "https://zerithum.com/authcallback",
    requiresApiKey: false,
    clientId: import.meta.env.VITE_SHOPIFY_CLIENT_ID || "YOUR_SHOPIFY_API_KEY",
    requiresShopName: true
  },
  {
    id: "twitch",
    name: "Twitch",
    icon: Tv,
    color: "bg-violet-500/10 border-violet-500/20 text-violet-400",
    description: "Track subscriptions, bits, and ad revenue",
    oauthUrl: "https://id.twitch.tv/oauth2/authorize",
    scope: "channel:read:subscriptions bits:read analytics:read:extensions",
    redirectUri: "https://zerithum.com/authcallback",
    requiresApiKey: false,
    clientId: import.meta.env.VITE_TWITCH_CLIENT_ID || "si8cip89mvmuhf02qpwrtcy47673pp"
  },
  {
    id: "substack",
    name: "Substack",
    icon: FileText,
    color: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    description: "Import newsletter subscriptions and earnings",
    requiresApiKey: true,
    validationUrl: "https://substack.com/api/v1/user"
  }
];

