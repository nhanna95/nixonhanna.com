// Archive entries, newest first. Rendered on /archive.html.
export interface ArchiveItem {
    title: string;
    href: string;
    /** YYYY-MM, used for the <time> datetime attribute */
    date: string;
    /** Human date label, e.g. "Jul 2026" */
    label: string;
    /** May contain inline HTML (e.g. <em>) */
    blurb: string;
}

export const archiveItems: ArchiveItem[] = [
    {
        title: 'The River Feels Colder This Time',
        href: '/the-river-feels-colder-this-time/',
        date: '2026-07',
        label: 'Jul 2026',
        blurb: 'A photo series. Boston, Summer 2026.',
    },
    {
        title: 'The Good Life Room',
        href: '/the-good-life-room/',
        date: '2026-05',
        label: 'May 2026',
        blurb: 'Final project for <em>What is The Good Life? Popular Culture and Narrative</em> course; a photo of my dorm in which I analyze how a few key items reflect my view of the good life.',
    },
    {
        title: 'Locating Centers of Clusters of Galaxies with Quadruple Images',
        href: 'https://arxiv.org/abs/2510.11356',
        date: '2025-10',
        label: 'Oct 2025',
        blurb: 'Paper on a new method for estimating the gravitational centers of clusters of galaxies I developed during my freshman summer, alongside Paul L. Schechter, Michael A. McDonald, and Marceau Limousin.',
    },
    {
        title: 'Nonlinear Instability in Solar Activity: Ellipticity Effects on Sunspot Oscillations',
        href: '/18_354_Final_Project.pdf',
        date: '2025-05',
        label: 'May 2025',
        blurb: 'Final project write-up for MIT 18.354, Nonlinear Dynamics: Continuum Systems',
    },
];
