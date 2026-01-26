import styles from './CCAStamp.module.css';

interface CCAStampProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const CCAStamp = ({ className = '', size = 'medium' }: CCAStampProps) => {
  return (
    <div className={`${styles.stamp} ${styles[size]} ${className}`}>
      <div className={styles.outer}>
        <div className={styles.inner}>
          <div className={styles.text}>
            <span className={styles.approved}>APPROVED BY THE</span>
            <span className={styles.code}>COMICS CODE</span>
            <span className={styles.authority}>AUTHORITY</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CCAStamp;
