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
    clientId: import.meta.env.VITE_GUMROAD_CLIENT_ID || "REPLACE_WITH_YOUR_GUMROAD_CLIENT_ID"
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
    clientId: "YOUR_STRIPE_CLIENT_ID"
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
    clientKey: "YOUR_TIKTOK_CLIENT_KEY"
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: Store,
    color: "bg-green-500/10 border-green-500/20 text-green-400",
    description: "Sync store sales, orders, and product revenue",
    oauthUrl: "https://YOUR_SHOP.myshopify.com/admin/oauth/authorize",
    scope: "read_orders,read_products,read_customers",
    redirectUri: "https://zerithum.com/authcallback",
    requiresApiKey: false,
    clientId: "YOUR_SHOPIFY_API_KEY",
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
    clientId: "YOUR_TWITCH_CLIENT_ID"
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
