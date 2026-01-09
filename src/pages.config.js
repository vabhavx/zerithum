import { lazy } from 'react';
import __Layout from './Layout.jsx';

const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const ConnectedApps = lazy(() => import('./pages/ConnectedApps'));
const ConnectedPlatforms = lazy(() => import('./pages/ConnectedPlatforms'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Help = lazy(() => import('./pages/Help'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Platforms = lazy(() => import('./pages/Platforms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Profile = lazy(() => import('./pages/Profile'));
const Reconciliation = lazy(() => import('./pages/Reconciliation'));
const Reports = lazy(() => import('./pages/Reports'));
const RevenueAutopsy = lazy(() => import('./pages/RevenueAutopsy'));
const Settings = lazy(() => import('./pages/Settings'));
const SettingsAccount = lazy(() => import('./pages/SettingsAccount'));
const SettingsConnectedApps = lazy(() => import('./pages/SettingsConnectedApps'));
const SettingsNotifications = lazy(() => import('./pages/SettingsNotifications'));
const SettingsPrivacy = lazy(() => import('./pages/SettingsPrivacy'));
const SettingsSubscription = lazy(() => import('./pages/SettingsSubscription'));
const Subscription = lazy(() => import('./pages/Subscription'));
const TaxEstimator = lazy(() => import('./pages/TaxEstimator'));
const TaxExport = lazy(() => import('./pages/TaxExport'));
const TaxReports = lazy(() => import('./pages/TaxReports'));
const TransactionAnalysis = lazy(() => import('./pages/TransactionAnalysis'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Pricing = lazy(() => import('./pages/Pricing'));

export const PAGES = {
    "AuthCallback": AuthCallback,
    "ConnectedApps": ConnectedApps,
    "ConnectedPlatforms": ConnectedPlatforms,
    "Dashboard": Dashboard,
    "Expenses": Expenses,
    "Help": Help,
    "Notifications": Notifications,
    "Platforms": Platforms,
    "Privacy": Privacy,
    "Profile": Profile,
    "Reconciliation": Reconciliation,
    "Reports": Reports,
    "RevenueAutopsy": RevenueAutopsy,
    "Settings": Settings,
    "SettingsAccount": SettingsAccount,
    "SettingsConnectedApps": SettingsConnectedApps,
    "SettingsNotifications": SettingsNotifications,
    "SettingsPrivacy": SettingsPrivacy,
    "SettingsSubscription": SettingsSubscription,
    "Subscription": Subscription,
    "TaxEstimator": TaxEstimator,
    "TaxExport": TaxExport,
    "TaxReports": TaxReports,
    "TransactionAnalysis": TransactionAnalysis,
    "Transactions": Transactions,
    "Pricing": Pricing,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
