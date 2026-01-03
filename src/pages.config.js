import ConnectedPlatforms from './pages/ConnectedPlatforms';
import Dashboard from './pages/Dashboard';
import Reconciliation from './pages/Reconciliation';
import Settings from './pages/Settings';
import TaxReports from './pages/TaxReports';
import Reports from './pages/Reports';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ConnectedPlatforms": ConnectedPlatforms,
    "Dashboard": Dashboard,
    "Reconciliation": Reconciliation,
    "Settings": Settings,
    "TaxReports": TaxReports,
    "Reports": Reports,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};