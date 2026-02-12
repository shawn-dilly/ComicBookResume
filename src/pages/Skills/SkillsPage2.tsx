import { forwardRef } from 'react';
import { Page, Panel, PowerMeter } from '../../components';
import { resumeData } from '../../data/resume';
import shared from '../pages.module.css';
import styles from '../Skills.module.css';

interface SkillsPage2Props {
  isVisible?: boolean;
}

const SkillsPage2 = forwardRef<HTMLDivElement, SkillsPage2Props>(
  ({ isVisible = false }, ref) => {
    // Get remaining skill categories
    const remainingCategories = resumeData.skills.slice(2);

    return (
      <Page ref={ref} pageNumber={7} variant="inner">
        <div className={styles.skillsPage}>
          {remainingCategories.map((category, catIndex) => (
            <Panel
              key={category.category}
              variant="standard"
              animate
              animationDelay={catIndex * 0.2}
              className={shared.flexPanel}
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
                      animate={isVisible}
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
  }
);

SkillsPage2.displayName = 'SkillsPage2';

export default SkillsPage2;
