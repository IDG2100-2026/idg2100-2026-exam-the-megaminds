import styles from './TermsPage.module.css';

export default function TermsPage() {
    const sections = [
        {
            id: 'services',
            title: 'Our Services',
            content: (
                <>
                    <p>
                        The House of Dice LLC ("Company", "we", "us", or "our") operates the website
                        {' '}
                        <a href="https://thehouseofdice.com" target="_blank" rel="noopener noreferrer">thehouseofdice.com</a>
                        {' '}
                        and related services (collectively, the "Services").
                    </p>
                    <p>
                        Information provided through the Services is not intended for distribution or use in any jurisdiction where such
                        distribution or use would violate law or regulation.
                    </p>
                </>
            ),
        },
        {
            id: 'ip',
            title: 'Intellectual Property Rights',
            content: (
                <>
                    <p>
                        We own or license all intellectual property rights in the Services, including source code, design, content,
                        logos, and trademarks. You are granted a limited, revocable, non-transferable license to access and use the
                        Services for personal, non-commercial purposes.
                    </p>
                    <p>
                        Except where explicitly permitted in these terms, no part of the Services may be copied, reproduced,
                        republished, distributed, sold, or otherwise exploited without our prior written consent.
                    </p>
                </>
            ),
        },
        {
            id: 'userreps',
            title: 'User Representations',
            content: (
                <>
                    <p>By using the Services, you represent and warrant that:</p>
                    <ul>
                        <li>all information you provide is accurate and up to date;</li>
                        <li>you have legal capacity to agree to these terms;</li>
                        <li>you are at least 18 years old;</li>
                        <li>you will not use bots, scripts, or automated methods to access the Services; and</li>
                        <li>your use of the Services complies with applicable law.</li>
                    </ul>
                </>
            ),
        },
        {
            id: 'registration',
            title: 'User Registration',
            content: (
                <p>
                    You may need to register to use parts of the Services. You are responsible for maintaining account confidentiality
                    and for all activity under your account.
                </p>
            ),
        },
        {
            id: 'prohibited',
            title: 'Prohibited Activities',
            content: (
                <>
                    <p>You agree not to misuse the Services. Prohibited behavior includes, without limitation:</p>
                    <ul>
                        <li>attempting unauthorized access, scraping, or automated extraction of data;</li>
                        <li>uploading malware, spam, deceptive, or abusive content;</li>
                        <li>harassment, intimidation, impersonation, or fraudulent conduct;</li>
                        <li>infringing on intellectual property or privacy rights; and</li>
                        <li>using the Services for illegal, unauthorized commercial, or competing purposes.</li>
                    </ul>
                </>
            ),
        },
        {
            id: 'ugc',
            title: 'User Generated Contributions',
            content: (
                <>
                    <p>
                        The Services may allow you to submit content ("Contributions"). You are solely responsible for your
                        Contributions and must ensure you have all rights and permissions needed to post them.
                    </p>
                    <p>
                        Contributions must not be unlawful, defamatory, threatening, discriminatory, deceptive, or otherwise objectionable.
                    </p>
                </>
            ),
        },
        {
            id: 'license',
            title: 'Contribution License',
            content: (
                <p>
                    By posting Contributions, you grant us a worldwide, non-exclusive, royalty-free, transferable license to host, use,
                    reproduce, distribute, publish, display, and create derivative works from your Contributions in connection with
                    operating and improving the Services.
                </p>
            ),
        },
        {
            id: 'management',
            title: 'Services Management',
            content: (
                <p>
                    We reserve the right to monitor the Services, remove content, restrict access, or take legal action where necessary
                    to protect users, the platform, and our legal rights.
                </p>
            ),
        },
        {
            id: 'privacy',
            title: 'Privacy Policy',
            content: (
                <p>
                    Our Privacy Policy is part of these terms. By using the Services, you agree to how we collect, use, and process
                    data as described in that policy. Services are hosted in Norway.
                </p>
            ),
        },
        {
            id: 'termination',
            title: 'Term and Termination',
            content: (
                <p>
                    These terms remain effective while you use the Services. We may suspend or terminate access at any time for violations,
                    legal reasons, or operational needs.
                </p>
            ),
        },
        {
            id: 'interruptions',
            title: 'Modifications and Interruptions',
            content: (
                <p>
                    We may modify, suspend, or discontinue any part of the Services without notice. We are not liable for interruptions,
                    delays, or temporary unavailability.
                </p>
            ),
        },
        {
            id: 'law',
            title: 'Governing Law',
            content: (
                <p>
                    These terms are governed by the laws of Norway. Disputes may be brought before the courts of Innlandet,
                    with applicable consumer protections in your place of residence where required by law.
                </p>
            ),
        },
        {
            id: 'disputes',
            title: 'Dispute Resolution',
            content: (
                <>
                    <p>
                        Parties agree to attempt informal negotiation for at least 30 days before formal proceedings. Where applicable,
                        disputes may be resolved by binding arbitration seated in Gjøvik, Norway, in English or Norwegian.
                    </p>
                    <p>
                        Certain claims, including intellectual property and injunctive relief claims, may be excluded from arbitration
                        as permitted by law.
                    </p>
                </>
            ),
        },
        {
            id: 'corrections',
            title: 'Corrections',
            content: (
                <p>
                    The Services may contain errors or omissions. We reserve the right to correct and update information at any time
                    without prior notice.
                </p>
            ),
        },
        {
            id: 'disclaimer',
            title: 'Disclaimer',
            content: (
                <p>
                    The Services are provided on an "as is" and "as available" basis without warranties of any kind, including implied
                    warranties of merchantability, fitness for a particular purpose, and non-infringement.
                </p>
            ),
        },
        {
            id: 'liability',
            title: 'Limitations of Liability',
            content: (
                <p>
                    To the fullest extent allowed by law, we are not liable for indirect, incidental, consequential, special, or punitive
                    damages, including loss of profits, data, or revenue arising from use of the Services.
                </p>
            ),
        },
        {
            id: 'indemnification',
            title: 'Indemnification',
            content: (
                <p>
                    You agree to defend, indemnify, and hold harmless the Company and its affiliates, officers, and employees from claims,
                    losses, liabilities, and expenses arising from your use of the Services, your Contributions, or breach of these terms.
                </p>
            ),
        },
        {
            id: 'userdata',
            title: 'User Data',
            content: (
                <p>
                    We may maintain data you transmit for service operation and support. While we use routine backups, you remain
                    responsible for your submitted data.
                </p>
            ),
        },
        {
            id: 'electronic',
            title: 'Electronic Communications, Transactions, and Signatures',
            content: (
                <p>
                    By using the Services, you consent to receive communications electronically and agree that electronic notices,
                    records, and signatures satisfy legal requirements for written communication.
                </p>
            ),
        },
        {
            id: 'misc',
            title: 'Miscellaneous',
            content: (
                <p>
                    These terms and related policies form the entire agreement between you and us. If any provision is held unenforceable,
                    the remaining provisions remain in full force. Failure to enforce any provision is not a waiver.
                </p>
            ),
        },
        {
            id: 'contact',
            title: 'Contact Us',
            content: (
                <p>
                    For questions or complaints regarding these terms or the Services, contact us at
                    {' '}
                    <a href="mailto:ben@ntnu.no">ben@ntnu.no</a>
                    .
                </p>
            ),
        },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.sheet}>
                <header className={styles.header}>
                    <p className={styles.eyebrow}>The House of Dice LLC</p>
                    <h1>Terms of Service</h1>
                    <p className={styles.meta}>Last updated: April 22, 2026</p>
                    <p className={styles.intro}>
                        These legal terms govern your access to and use of our Services. By using the Services, you agree to be bound
                        by these terms. If you do not agree, you must discontinue use immediately.
                    </p>
                </header>

                <nav className={styles.toc} aria-label="Table of contents">
                    <h2>Table of Contents</h2>
                    <ol>
                        {sections.map((section) => (
                            <li key={section.id}>
                                <a href={`#${section.id}`}>{section.title}</a>
                            </li>
                        ))}
                    </ol>
                </nav>

                {sections.map((section) => (
                    <section key={section.id} id={section.id} className={styles.section}>
                        <h2>{section.title}</h2>
                        {section.content}
                    </section>
                ))}

                <footer className={styles.footerNote}>
                    <p>
                        This Terms of Service page was prepared from your provided legal text and adapted into a readable web format.
                        Source template attribution:
                        {' '}
                        <a href="https://termly.io/products/terms-and-conditions-generator/" target="_blank" rel="noopener noreferrer">
                            Termly Terms and Conditions Generator
                        </a>
                        .
                    </p>
                </footer>
            </div>
        </div>
    );
}
