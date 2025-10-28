import {defineConfig} from 'vitepress';
import {navBarRoutes} from './routes/navbar';
import {sidebarRoutes} from "./routes/sidebar/index.js";

export default defineConfig({
    title: 'PrivateAim',
    base: '/',
    head: [['link', {rel: 'icon', href: '/images/icon/favicon.ico'}]],
    ignoreDeadLinks: "localhostLinks",
    themeConfig: {
        socialLinks: [
            {icon: 'github', link: 'https://github.com/PrivateAim'},
            {icon: 'discord', link: 'https://discord.gg/yCTX7ePnhb'},
        ],
        editLink: {
            pattern: 'https://github.com/PrivateAim/documentation/edit/master/src/:path',
            text: 'Edit this page on GitHub'
        },
        logo: {
            light: '/images/icon/icon_flame_dark.png',
            dark: '/images/icon/icon_flame_light.png'
        },
        siteTitle: false,
        nav: navBarRoutes,
        sidebar: sidebarRoutes,
        footer: {
            copyright: 'Copyright © 2023-present PrivateAim Consortia'
        }
    }
});
