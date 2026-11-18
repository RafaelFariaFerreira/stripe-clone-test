import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found">
      <h1 className="not-found__title">Page not found</h1>
      <p className="not-found__text">The page you are looking for doesn&apos;t exist.</p>
      <Link href="/payments" className="button button--secondary">
        Go to payments
      </Link>
    </div>
  );
}
