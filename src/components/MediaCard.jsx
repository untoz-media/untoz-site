export default function MediaCard({ item, large = false }) {
  const [tag, title, text, color] = item;

  return (
    <a className={`media-card ${large ? 'large' : ''}`} href="#recent">
      <div className={`media-image ${color}`}>
        <span>{tag}</span>
      </div>
      <div className="media-card-body">
        <small>{tag}</small>
        <h3>{title}</h3>
        {large && <p>{text}</p>}
      </div>
    </a>
  );
}
