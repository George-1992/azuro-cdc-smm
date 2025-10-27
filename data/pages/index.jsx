import AuthEl from "@/components/auth"
import VerifyAccount from "@/components/auth/verify";
import AiAgentPage from "@/data/pages/aiAgent";
import Home from "@/data/pages/home";
import Profile from "@/data/pages/profile"
import Settings from "@/data/pages/settings";
import Test from "@/data/pages/test";

const pagesMap = [
    // AUTH PAGES
    {
        pathname: '/auth/signin',
        Component: (props) => { return <AuthEl type="signin" {...props} /> },
    },
    {
        pathname: '/auth/signup',
        Component: (props) => { return <AuthEl type="signup" {...props} /> },
    },
    {
        pathname: '/auth/reset',
        Component: (props) => { return <AuthEl type="reset" {...props} /> },
    },
    {
        pathname: '/auth/verify',
        Component: (props) => { return <VerifyAccount {...props} /> },
    },
    // MAIN APP PAGES
    {
        pathname: '/',
        Component: (props) => { return <Home {...props} />; },
    },
    {
        pathname: '/profile',
        Component: (props) => { return <Profile {...props} />; },
    },
    {
        pathname: '/settings',
        Component: (props) => { return <Settings {...props} />; },
    },
    {
        pathname: '/not-found',
        Component: (props) => { return <div className="container-main">pagesMap not-found</div> },
    },
    {
        pathname: '/ai-agent',
        Component: (props) => { return <AiAgentPage {...props} />; },
    },
    {
        pathname: '/test',
        Component: (props) => { return <Test {...props} />; },
    },
    {
        pathname: '/test/{{ITEM_ID}}',
        Component: (props) => { return <Test {...props} />; },
    },

]

export default pagesMap;