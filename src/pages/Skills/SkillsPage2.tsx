import { forwardRef } from 'react';
import { Page, Panel, PowerMeter } from '../../components';
import { resumeData } from '../../data/resume';
import { splitSkillCategories } from './layout';
import shared from '../pages.module.css';
import styles from '../Skills.module.css';

interface SkillsPage2Props {
  isVisible?: boolean;
}

const SkillsPage2 = forwardRef<HTMLDivElement, SkillsPage2Props>(
  ({ isVisible = false }, ref) => {
    // Right page shows every category after the left page's
    const remainingCategories = splitSkillCategories(resumeData.skills).right;
    // Three or more panels need tighter padding and gaps to fit without clipping
    const dense = remainingCategories.length > 2;

    return (
      <Page ref={ref} pageNumber={7} variant="inner">
        <div className={`${styles.skillsPage} ${dense ? styles.skillsPageDense : ''}`}>
          {remainingCategories.map((category, catIndex) => (
            <Panel
              key={category.category}
              variant="standard"
              animate
              animationDelay={catIndex * 0.2}
              className={shared.flexPanel}
              style={{ padding: dense ? '7px 10px' : '12px' }}
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
