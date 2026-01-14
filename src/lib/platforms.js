import {
  Youtube,
  Users,
  CircleDollarSign,
  ShoppingBag,
  Instagram,
  Music
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
    redirectUri: "https://zerithum-copy-36d43903.base44.app/authcallback",
    requiresApiKey: false,
    clientId: "985180453886-pof8b9qoqf1a7cha901khhg9lk7548b4.apps.googleusercontent.com"
  },
  {
    id: "patreon",
    name: "Patreon",
    icon: Users,
    color: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    description: "Sync pledges, membership tiers, and patron data",
    oauthUrl: "https://www.patreon.com/oauth2/authorize",
    scope: "identity identity[email] campaigns campaigns.members",
    redirectUri: "https://zerithum-copy-36d43903.base44.app/authcallback",
    requiresApiKey: false,
    clientId: "i1ircOfqA2eD5ChN4-d6uElxt4vjWzIEv4vCfj0K_92LqilSM5OA_dJS24uFjiTR"
  },
  {
    id: "gumroad",
    name: "Gumroad",
    icon: ShoppingBag,
    color: "bg-pink-500/10 border-pink-500/20 text-pink-400",
    description: "Import product sales, subscriptions, and license data",
    requiresApiKey: true,
    validationUrl: "https://api.gumroad.com/v2/user"
  },
  {
    id: "stripe",
    name: "Stripe",
    icon: CircleDollarSign,
    color: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
    description: "Connect payments, subscriptions, and payout data",
    oauthUrl: "https://connect.stripe.com/oauth/authorize",
    scope: "read_write",
    redirectUri: "https://zerithum-copy-36d43903.base44.app/authcallback",
    requiresApiKey: false,
    clientId: "YOUR_STRIPE_CLIENT_ID"
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    description: "Pull revenue from Instagram Insights and monetization",
    oauthUrl: "https://www.facebook.com/v20.0/dialog/oauth",
    scope: "instagram_basic,instagram_manage_insights,pages_read_engagement",
    redirectUri: "https://zerithum-copy-36d43903.base44.app/authcallback",
    requiresApiKey: false,
    clientId: "YOUR_META_APP_ID"
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: Music,
    color: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    description: "Track Creator Fund earnings and video insights",
    oauthUrl: "https://www.tiktok.com/v2/auth/authorize/",
    scope: "video.list,user.info.basic,video.insights",
    redirectUri: "https://zerithum-copy-36d43903.base44.app/authcallback",
    requiresApiKey: false,
    clientKey: "YOUR_TIKTOK_CLIENT_KEY"
  }
];
