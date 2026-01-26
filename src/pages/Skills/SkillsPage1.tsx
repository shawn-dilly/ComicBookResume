import { forwardRef } from 'react';
import { Page, Panel, PowerMeter } from '../../components';
import { resumeData } from '../../data/resume';
import styles from '../pages.module.css';

const SkillsPage1 = forwardRef<HTMLDivElement>((_, ref) => {
  // Get first two skill categories
  const skillCategories = resumeData.skills.slice(0, 2);

  return (
    <Page ref={ref} pageNumber={5} variant="inner">
      <div className={styles.skillsPage}>
        <h2 className={styles.pageHeader}>Powers & Abilities</h2>

        {skillCategories.map((category, catIndex) => (
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
      </div>
    </Page>
  );
});

SkillsPage1.displayName = 'SkillsPage1';

export default SkillsPage1;
