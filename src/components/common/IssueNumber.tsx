import styles from './common.module.css';

interface IssueNumberProps {
  number?: number | string;
  month?: string;
  year?: string;
  price?: string;
  className?: string;
}

const IssueNumber = ({
  number = 1,
  month = 'JAN',
  year,
  price = '12¢',
  className = '',
}: IssueNumberProps) => {
  const currentYear = year || new Date().getFullYear().toString();

  return (
    <div className={`${styles.issueBox} ${className}`}>
      <div className={styles.issueNumber}>
        <span className={styles.issueLabel}>#</span>
        <span className={styles.issueValue}>{number}</span>
      </div>
      <div className={styles.issueDate}>
        {month} {currentYear}
      </div>
      <div className={styles.issuePrice}>{price}</div>
    </div>
  );
};

export default IssueNumber;
