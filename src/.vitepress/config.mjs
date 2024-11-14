import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'PrivateAim',
    base: '/',
    head: [['link', { rel: 'icon', href: '/images/icon/favicon.ico' }]],
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
        nav: [
            {
                text: 'Getting Started',
                link: '/getting-started/',
                activeMatch: '/getting-started/'
            },
            {
                text: 'Guide',
                activeMatch: '/guide/',
                items: [
                    {text: 'User', link: '/guide/user/'},
                    {text: 'Admin', link: '/guide/admin/'},
                    {text: 'Deployment', link: '/guide/deployment/'},
                ]
            },
            {
                text: 'About',
                activeMatch: '/about/',
                items: [
                    {text: 'Team', link: '/about/team'},
                ]
            }
        ],
        sidebar: {
            '/getting-started': [
                {
                    text: 'Overview',
                    items: [
                        {text: 'Introduction', link: '/getting-started/'},
                        {text: 'Architecture', link: '/getting-started/architecture'},
                        {text: 'Components', link: '/getting-started/components'},
                        {text: 'Guides', link: '/getting-started/guides'},
                        {text: 'Glossar', link: '/getting-started/glossar'},
                    ]
                }
            ],
            '/guide/user': [
                {
                    text: 'Getting Started',
                    items: [
                        {text: 'Introduction', link: '/guide/user/'},
                        // Quickstart
                    ]
                },
                {
                    text: 'Hub',
                    items: [
                        // {text: 'Key Management', link: '/guide/user/key-management'},
                        {text: 'Project', link: '/guide/user/project'},
                        {text: 'Analysis', link: '/guide/user/analysis'},
                    ]
                },
                {
                    text: 'Concepts/Tutorials',
                    items: [
                        {text: 'Analysis Coding', link: '/guide/user/analysis-coding'},
                        // {text: 'FHIR Query', link: '/guide/user/fhir-query'},
                        // {text: 'Homomorphic Encryption', link: '/guide/user/homomorphic-encryption'},
                    ]
                },
                {
                    text: 'SKDs',
                    items: [
                        {text: 'Core SDK', link: '/guide/user/sdk-core-docu'},
                        // {text: 'FHIR Query', link: '/guide/user/fhir-query'},
                        // {text: 'Homomorphic Encryption', link: '/guide/user/homomorphic-encryption'},
                    ]
                }
            ],
            '/guide/admin': [
                {
                    text: 'Getting Started',
                    items: [
                        {text: 'Introduction', link: '/guide/admin/'},
                        {text: 'Reviewing', link: '/guide/admin/reviewing'},
                    ]
                },
                {
                    text: 'Hub',
                    items: [
                        {text: 'Realms', link: '/guide/admin/realms'},
                        {text: 'Identity Providers', link: '/guide/admin/identity-providers'},
                        {text: 'Robots', link: '/guide/admin/robots'},
                        {text: 'Users', link: '/guide/admin/users'},
                        {text: 'Roles', link: '/guide/admin/roles'},
                        {text: 'Permissions', link: '/guide/admin/permissions'},
                        {text: 'Nodes', link: '/guide/admin/node-management'},
                        {text: 'Project Review', link: '/guide/admin/project-review'},
                        {text: 'Analysis Review', link: '/guide/admin/analysis-review'},
                    ]
                },
                {
                    text: 'Node',
                    items: [
                        {text: 'Data Store Management', link: '/guide/admin/data-store-management'},
                        {text: 'Analysis Execution', link: '/guide/admin/analysis-execution'},
                        {text: 'Keycloak & Access Control', link: '/guide/admin/keycloak-access-control'}
                    ]
                },
            ],
            '/guide/deployment': [
                {
                    text: 'Getting Started',
                    items: [
                        {text: 'Introduction', link: '/guide/deployment/'},
                    ]
                },
                {
                    text: 'Node',
                    items: [
                        {text: 'Registration', link: '/guide/deployment/node-registration'},
                        {text: 'Installation', link: '/guide/deployment/node-installation'},
                        // {text: 'Troubleshooting', link: '/guide/deployment/node-troubleshooting'},
                    ]
                },
                {
                    text: 'Hub',
                    items: [
                        {text: 'Introduction', link: '/guide/deployment/hub-introduction'}
                    ]
                }
            ],
        },
        footer: {
             copyright: 'Copyright © 2023-present PrivateAim Consortia'
        }
    }
});
