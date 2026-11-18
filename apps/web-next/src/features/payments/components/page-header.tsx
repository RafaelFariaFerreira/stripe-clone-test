import { Icon } from '@/components/ui/icon';

/** Static heading: "Transactions" with the primary actions (server component). */
export function PaymentsPageHeader() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-header__title">Transactions</h1>
        <div className="page-header__actions">
          <button type="button" className="button button--primary">
            <Icon name="plus" size={12} />
            <span className="button__label">Create payment</span>
          </button>
          <button type="button" className="button button--secondary">
            <Icon name="analyze" size={12} />
            <span className="button__label">Analyze</span>
          </button>
        </div>
      </div>
      <nav className="tabs" aria-label="Transactions">
        {['Payments', 'Payouts', 'Top-ups', 'Collected fees', 'Transfers', 'All activity'].map((tab) => (
          <a
            key={tab}
            href={tab === 'Payments' ? '/payments' : '#'}
            className="tabs__tab"
            aria-current={tab === 'Payments' ? 'page' : undefined}
          >
            {tab}
          </a>
        ))}
      </nav>
    </>
  );
}
