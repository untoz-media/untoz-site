import { ArrowRight } from 'lucide-react';

export default function Section({ id, title, link = 'View all', children }) {
  return (
    <section className="portal-section" id={id}>
      <div className="portal-section-head">
        <h2>{title}</h2>
        <a href={`#${id}`}>
          {link}
          <ArrowRight size={14} />
        </a>
      </div>
      {children}
    </section>
  );
}
