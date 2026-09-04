import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import type { ComplianceStatus, Inspection } from '../types';
import { images } from '../config/images';

const navItems = [
  ['/', 'Home'], ['/about', 'About LexPack'], ['/legal-metrology', 'Legal Metrology'],
  ['/inspection', 'Inspection'], ['/reports', 'Reports'], ['/analytics', 'Analytics'],
  ['/resources', 'Resources'], ['/contact', 'Contact'],
] as const;

export function CampaignPlaceholder({ label, className = '', src }: { label: string; className?: string; src?: string }) {
  return <div className={`campaign-placeholder ${className}`}><img src={src ?? images.publicService} alt={label} loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} /></div>;
}

export function GovernmentPageBanner({ title, subtitle, children, image }: { title: string; subtitle?: string; children?: React.ReactNode; image?: string }) {
  return <section className="government-banner"><div className="container">{children}<div className="banner-content"><div><p className="banner-kicker">LEXPACK / PUBLIC SERVICE PROTOTYPE</p><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{image && <div className="banner-image"><img src={image} alt="Legal metrology public service illustration" loading="lazy" onError={event => { event.currentTarget.style.display = 'none'; }} /></div>}</div></div></section>;
}

export function Breadcrumb({ items }: { items: string[] }) {
  return <nav className="breadcrumb" aria-label="Breadcrumb">{items.map((item, index) => <span key={item}>{index > 0 && <span aria-hidden="true"> / </span>}{item}</span>)}</nav>;
}

function AccessibilityPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [settings, setSettings] = useState({ bigText: false, spacing: false, lineHeight: false, links: false, dyslexia: false, hideImages: false, cursor: false, dark: false, invert: false });
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(settings).forEach(([key, value]) => root.classList.toggle(`access-${key}`, value));
    return () => Object.keys(settings).forEach(key => root.classList.remove(`access-${key}`));
  }, [settings]);
  if (!open) return null;
  const toggle = (key: keyof typeof settings) => setSettings(current => ({ ...current, [key]: !current[key] }));
  return <aside className="access-panel" aria-label="Accessibility controls"><div className="access-panel-head"><h2>Accessibility menu</h2><button className="close-button" onClick={onClose} aria-label="Close accessibility menu">×</button></div><div className="access-controls">{([['bigText', 'Bigger text'], ['spacing', 'Text spacing'], ['lineHeight', 'Line height'], ['links', 'Highlight links'], ['dyslexia', 'Dyslexia-friendly'], ['hideImages', 'Hide images'], ['cursor', 'Large cursor'], ['dark', 'Dark mode'], ['invert', 'Invert colours']] as const).map(([key, label]) => <button key={key} className={settings[key] ? 'is-on' : ''} onClick={() => toggle(key)} aria-pressed={settings[key]}>{label}</button>)}</div><button className="button secondary" onClick={() => setSettings({ bigText: false, spacing: false, lineHeight: false, links: false, dyslexia: false, hideImages: false, cursor: false, dark: false, invert: false })}>Reset accessibility</button></aside>;
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  return <>
    <div className="utility-bar"><div>भारत सरकार <span> / GOVERNMENT OF INDIA</span></div><div className="utility-links"><a href="#main-content">Skip to main</a><button onClick={() => setAccessOpen(true)}>Search</button><button onClick={() => setAccessOpen(true)}>Text Size</button><button onClick={() => setAccessOpen(true)}>Accessibility</button><button onClick={() => setAccessOpen(true)}>Screen Reader Access</button><a href="#site-map">Sitemap</a><span>English | ગુજરાતી</span></div></div>
    <header className="site-header"><div className="institutional-row"><div className="identity"><div className="emblem-placeholder"><img src={images.governmentEmblem} alt="State Emblem of India" onError={event => { event.currentTarget.style.display = 'none'; }} /></div><div><Link className="brand" to="/">LexPack</Link><p>Legal Metrology Packaging Compliance Platform</p><small>SIH prototype · NOT AN OFFICIAL GOVERNMENT WEBSITE</small></div></div><div className="campaign-slots"><CampaignPlaceholder label="Make in India campaign" src={images.makeInIndia}/><CampaignPlaceholder label="Azadi Ka Amrit Mahotsav campaign" src={images.azadiMahotsav}/><CampaignPlaceholder label="Digital India campaign" src={images.digitalIndia}/><CampaignPlaceholder label="Public service campaign" src={images.publicService}/></div></div><button className="menu-toggle" onClick={() => setMenuOpen(open => !open)} aria-expanded={menuOpen} aria-controls="primary-navigation">Menu</button><nav id="primary-navigation" className={`primary-nav ${menuOpen ? 'open' : ''}`} aria-label="Primary navigation">{navItems.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuOpen(false)}>{label}</NavLink>)}<NavLink to="/login" onClick={() => setMenuOpen(false)}>Sign in</NavLink></nav></header><AccessibilityPanel open={accessOpen} onClose={() => setAccessOpen(false)}/>
  </>;
}

export function Shell({ children }: { children: React.ReactNode }) { return <><Header/><main id="main-content">{children}</main><footer id="site-map"><div><strong>LexPack</strong><p>Legal Metrology Packaging Compliance Platform</p><p className="footer-disclaimer">NOT AN OFFICIAL GOVERNMENT OF INDIA OR GOVERNMENT OF GUJARAT APPLICATION.</p></div><div><h2>Important links</h2><Link to="/about">About LexPack</Link><Link to="/legal-metrology">Legal Metrology</Link><Link to="/resources">Resources</Link></div><div><h2>Services</h2><Link to="/inspection">Start an inspection</Link><Link to="/reports">Reports</Link><Link to="/analytics">Analytics</Link></div><div><h2>Contact and support</h2><p>Prototype support desk<br/>Department / office selector available in prototype.</p></div><div className="footer-bottom">SIH prototype · Content is for demonstration only.</div></footer></>; }
export function StatusBadge({ status }: { status: ComplianceStatus }) { return <span className={`badge ${status.toLowerCase().replaceAll(' ','-')}`}>{status}</span>; }
export function InspectionCard({ item }: { item: Inspection }) { return <Link className="inspection-card" to={`/reports/${item.id}`}><div><strong>{item.imageName}</strong><span>{new Date(item.createdAt).toLocaleString()}</span></div><div className="card-score"><b>{item.summary.compliant}/8</b><span>compliant</span></div></Link>; }
export function PageTitle({ eyebrow, title, children, image }: { eyebrow: string; title: string; children?: React.ReactNode; image?: string }) { return <><GovernmentPageBanner title={title} image={image}><Breadcrumb items={['Home', title]}/></GovernmentPageBanner><section className="page-title container"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{children}</section></>; }
