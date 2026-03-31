import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', title, onClick, padding = 'md' }: CardProps) {
  return (
    <div 
      className={`card card-padding-${padding} ${onClick ? 'card-clickable' : ''} ${className}`}
      onClick={onClick}
    >
      {title && <h3 className="card-title">{title}</h3>}
      {children}
    </div>
  );
}
