---
layout: page
---
<script setup>
import {
  VPTeamPage,
  VPTeamPageTitle,
  VPTeamMembers
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
    ]
  },
  {
    avatar: 'https://www.github.com/SirHerr.png',
    name: 'Marius de Arruda Botelho Herr',
    title: 'Coordinator & Analyst',
    links: [
      { icon: 'github', link: 'https://github.com/SirHerr' },
      { icon: 'linkedin', link: 'https://de.linkedin.com/in/marius-de-arruda-botelho-herr-60b89b18b' },
    ]
  },
  {
    avatar: 'https://www.github.com/mjugl.png',
    name: 'Maximilian Jugl',
    title: 'Node Lead & Developer',
    links: [
      { icon: 'github', link: 'https://github.com/mjugl' },
    ]
  },
  { 
    avatar: 'https://www.github.com/DiCanio.png',
    name: 'Alexander Twrdik',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/DiCanio' }
    ]
  },
  { 
    avatar: 'https://www.github.com/antidodo.png',
    name: 'David Hieber',
    title: 'Developer & Analyst',
    links: [
      { icon: 'github', link: 'https://github.com/antidodo' }
    ]
  },
  { 
    avatar: 'https://www.github.com/Nightknight3000.png',
    name: 'Alexander Röhl',
    title: 'Developer & Analyst',
    links: [
      { icon: 'github', link: 'https://github.com/Nightknight3000' }
    ]
  },
  { 
    avatar: 'https://www.github.com/Mehrsary.png',
    name: 'Mehrshad',
    title: 'Developer & Analyst',
    links: [
      { icon: 'github', link: 'https://github.com/Mehrsary' }
    ]
  },
  { 
    avatar: 'https://www.github.com/brucetony.png',
    name: 'Bruce Schultz',
    title: 'Developer',
    links: [
      { icon: 'github', link: 'https://github.com/brucetony' }
    ]
  },
]
</script>

<VPTeamPage>
  <VPTeamPageTitle>
    <template #title>
      Our Team
    </template>
  </VPTeamPageTitle>
  <VPTeamMembers
    :members="members"
  />
</VPTeamPage>
