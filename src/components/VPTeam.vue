<script setup>
import {
    VPTeamMembers,
    VPTeamPage,
    VPTeamPageTitle,
} from 'vitepress/theme';

const members = [
    {
        avatar: 'https://www.github.com/tada5hi.png',
        name: 'Peter Placzek',
        title: 'Hub Lead & Developer',
        links: [
            { icon: 'github', link: 'https://github.com/tada5hi' },
            { icon: 'twitter', link: 'https://twitter.com/tada5hi' },
            { icon: 'linkedin', link: 'https://www.linkedin.com/in/peter-placzek-047a74210/' },
        ],
    },
    {
        avatar: 'https://www.github.com/SirHerr.png',
        name: 'Marius Herr',
        title: 'Coordinator & Analyst',
        links: [
            { icon: 'github', link: 'https://github.com/SirHerr' },
            { icon: 'linkedin', link: 'https://de.linkedin.com/in/marius-de-arruda-botelho-herr-60b89b18b' },
        ],
    },
    {
        avatar: 'https://www.github.com/brucetony.png',
        name: 'Bruce Schultz',
        title: 'Node Lead & Developer',
        links: [
            { icon: 'github', link: 'https://github.com/brucetony' },
        ],
    },
    {
        avatar: 'https://www.github.com/DiCanio.png',
        name: 'Alexander Twrdik',
        title: 'Developer',
        links: [
            { icon: 'github', link: 'https://github.com/DiCanio' },
        ],
    },
    {
        avatar: 'https://www.github.com/antidodo.png',
        name: 'David Hieber',
        title: 'Developer & Analyst',
        links: [
            { icon: 'github', link: 'https://github.com/antidodo' },
        ],
    },
    {
        avatar: 'https://www.github.com/Nightknight3000.png',
        name: 'Alexander Röhl',
        title: 'Developer & Analyst',
        links: [
            { icon: 'github', link: 'https://github.com/Nightknight3000' },
        ],
    },
    {
        avatar: 'https://www.github.com/Mehrsary.png',
        name: 'Mehrshad',
        title: 'Developer & Analyst',
        links: [
            { icon: 'github', link: 'https://github.com/Mehrsary' },
        ],
    },
    {
        avatar: 'https://github.com/maxju.png',
        name: 'Max Schaible',
        title: 'Developer',
        links: [
            { icon: 'github', link: 'https://github.com/maxju' },
        ],
    },
    {
        avatar: 'https://github.com/pbrassel.png',
        name: 'Paul Brassel',
        title: 'Developer',
        links: [
            { icon: 'github', link: 'https://github.com/pbrassel' },
        ],
    },
    {
        avatar: 'https://github.com/AbuAttieh.png',
        name: 'Hammam Abu Attieh',
        title: 'Privacy Engineer ',
        links: [
            { icon: 'github', link: 'https://github.com/AbuAttieh' },
        ],
    },
    {
        avatar: 'https://github.com/mhalilovic.png',
        name: 'Mehmed Halilovic',
        title: 'Privacy Engineer ',
        links: [
            { icon: 'github', link: 'https://github.com/mhalilovic' },
        ],
    },
    {
        avatar: 'https://github.com/CemBykr.png',
        name: 'Cem Ata Baykara',
        title: 'Privacy Engineer ',
        links: [
            { icon: 'github', link: 'https://github.com/CemBykr' },
        ],
    },
    {
        avatar: 'https://github.com/not-a-feature.png',
        name: 'Jules Kreuer',
        title: 'Analyst',
        links: [
            { icon: 'github', link: 'https://github.com/not-a-feature' },
        ],
    },
    {
        avatar: 'https://github.com/marlenamey.png',
        name: 'Marlena Meyer',
        title: 'Analyst',
        links: [
            { icon: 'github', link: 'https://github.com/marlenamey' },
        ],
    },
    {
        avatar: 'https://github.com/Demokritus.png',
        name: 'Gherman Sergei',
        title: 'Analyst',
        links: [
            { icon: 'github', link: 'https://github.com/Demokritus' },
        ],
    },
    {
        avatar: 'https://github.com/NAS-Ragde.png',
        name: 'Nayeli A. Silva',
        title: 'Analyst',
        links: [
            { icon: 'github', link: 'https://github.com/NAS-Ragde' },
        ],
    },
    {
        avatar: 'https://github.com/basavaraj-hampiholi.png',
        name: 'Basavaraj Hampiholi',
        title: 'Analyst',
        links: [
            { icon: 'github', link: 'https://github.com/basavaraj-hampiholi' },
        ],
    },
    {
        avatar: 'https://github.com/reneraab.png',
        name: 'René Raab',
        title: 'Analyst',
        links: [
            { icon: 'github', link: 'https://github.com/reneraab' },
        ],
    },
    {
        avatar: 'https://github.com/tippmannp.png',
        name: 'Patric Tippmann',
        title: 'Analyst',
        links: [
            { icon: 'github', link: 'https://github.com/tippmannp' },
        ],
    },
];

const alumni = [
    {
        avatar: 'https://www.github.com/mjugl.png',
        name: 'Maximilian Jugl',
        title: 'Former Node Lead & Developer',
        links: [
            { icon: 'github', link: 'https://github.com/mjugl' },
        ],
    },
    {
        avatar: 'https://www.github.com/RaphaelRe.png',
        name: 'Raphael Rehms',
        title: 'Analyst',
        links: [
            { icon: 'github', link: 'https://github.com/raphaelre' },
        ],
    },
];

const pi = [
    {
        avatar: 'https://www.github.com/okohlbacher.png',
        name: 'Oliver Kohlbacher',
        title: 'PI & Professor',
        links: [
            { icon: 'github', link: 'https://github.com/okohlbacher' },
        ],
    },
    {
        avatar: 'https://www.github.com/prasser.png',
        name: 'Fabian Prasser',
        title: 'PI & Professor',
        links: [
            { icon: 'github', link: 'https://github.com/prasser' },
        ],
    },
    {
        avatar: 'https://www.github.com/danielrueckert.png',
        name: 'Daniel Rückert',
        title: 'PI & Professor',
        links: [
            { icon: 'github', link: 'https://github.com/danielrueckert' },
        ],
    },
    {
        avatar: 'https://www.github.com/tkirsten.png',
        name: 'Toralf Kirsten',
        title: 'Professor',
        links: [
            { icon: 'github', link: 'https://github.com/tkirsten' },
        ],
    },
    {
        avatar: 'https://www.github.com/mjugl.png',
        name: 'Thomas Ganslandt',
        title: 'Professor',
        links: [
            { icon: 'github', link: 'https://github.com/mjugl' },
        ],
    },
    {
        avatar: 'https://www.github.com/RaphaelRe.png',
        name: 'Christoph Dietrich',
        title: 'Professor',
        links: [
            { icon: 'github', link: 'https://github.com/raphaelre' },
        ],
    },
    {
        avatar: 'https://www.github.com/meteakgun.png',
        name: 'Mete Akgün',
        title: 'Junior Professor',
        links: [
            { icon: 'github', link: 'https://github.com/meteakgun' },
        ],
    },
    {
        avatar: 'https://www.github.com/NicoPfeifer.png',
        name: 'Nico Pfeifer',
        title: 'Professor',
        links: [
            { icon: 'github', link: 'https://github.com/NicoPfeifer' },
        ],
    },
    {
        avatar: 'https://www.github.com/rfloca.png',
        name: 'Ralf Floca',
        title: 'Professor',
        links: [
            { icon: 'github', link: 'https://github.com/rfloca' },
        ],
    },
];

</script>
<template>
    <VPTeamPage style="margin-top:0px;">
        <VPTeamPageTitle style="padding-top: 48px;">
            <template #title>
                Our Team
            </template>
        </VPTeamPageTitle>
        <VPTeamMembers
            :members="members"
        />

        <VPTeamPageTitle style="padding-top: 48px;">
            <template #title>
                Project Leads
            </template>
        </VPTeamPageTitle>
        <VPTeamMembers :members="pi" />

        <VPTeamPageTitle style="padding-top: 48px;">
            <template #title>
                Alumni
            </template>
        </VPTeamPageTitle>
        <VPTeamMembers :members="alumni" />
    </VPTeamPage>
</template>
