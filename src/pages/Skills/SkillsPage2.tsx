import { forwardRef } from 'react';
import { Page, Panel, PowerMeter, ActionWord } from '../../components';
import { resumeData } from '../../data/resume';
import styles from '../pages.module.css';

const SkillsPage2 = forwardRef<HTMLDivElement>((_, ref) => {
  // Get remaining skill categories (if any)
  const remainingCategories = resumeData.skills.slice(2);

  // If no remaining categories, show a summary panel
  if (remainingCategories.length === 0) {
    return (
      <Page ref={ref} pageNumber={6} variant="inner">
        <div className={styles.skillsPage}>
          <Panel
            variant="splash"
            animate
            animationDelay={0.1}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              position: 'relative'
            }}
          >
            <ActionWord word="ZAP" size="large" rotation={-5} />
            <div style={{
              marginTop: '20px',
              textAlign: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              color: 'var(--comic-blue)'
            }}>
              ALWAYS LEARNING
            </div>
            <div style={{
              marginTop: '8px',
              textAlign: 'center',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              maxWidth: '80%'
            }}>
              New technologies? Bring them on! Our hero is always expanding their arsenal of skills.
            </div>
          </Panel>
        </div>
      </Page>
    );
  }

  return (
    <Page ref={ref} pageNumber={6} variant="inner">
      <div className={styles.skillsPage}>
        {remainingCategories.map((category, catIndex) => (
          <Panel
            key={category.category}
            variant="standard"
            animate
            animationDelay={catIndex * 0.2}
            className={styles.flexPanel}
            style={{ padding: '12px' }}
          >
            <div className={styles.skillCategory}>
              <h3 className={styles.skillCategoryHeader}>
                {category.category}
              </h3>
              <div className={styles.skillsList}>
                {category.skills.map((skill, skillIndex) => (
                  <PowerMeter
                    key={skill.name}
                    label={skill.name}
                    level={skill.level}
                    color={skill.color}
                    animate
                    animationDelay={catIndex * 0.2 + skillIndex * 0.1 + 0.3}
                  />
                ))}
              </div>
            </div>
          </Panel>
        ))}

        <div style={{
          marginTop: 'auto',
          textAlign: 'center',
          fontFamily: 'var(--font-caption)',
          fontSize: '10px',
          fontStyle: 'italic',
          color: 'var(--text-caption)'
        }}>
          * Power levels measured under standard conditions
        </div>
      </div>
    </Page>
  );
});

SkillsPage2.displayName = 'SkillsPage2';

export default SkillsPage2;
