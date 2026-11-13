/**
 * PageStack - every page of the reader, in order. Reader positions and shows them; each page is a PageFace.
 */

import type { Ref } from 'react';
import type { MissionId } from '../../data/hireMe';
import { PAGES, pageIndex } from '../pages';
import { AlliesPage } from './Allies';
import { BattleEarlyCareer, BattleEzlinks, BattleGrodivo, BattlePeopleReady } from './Battles';
import { MobileAdPage } from './AdPage';
import { CaseFileDossier, CaseFileLoop } from './CaseFile';
import { ContactPage } from './Contact';
import { MobileCover } from './Cover';
import { OriginStoryPage } from './OriginStory';
import { PersonnelPage } from './Personnel';
import { PowersPage } from './Powers';

interface PageStackProps {
  /** Ref callback factory: `setRef(i)` returns the callback for page `i`. */
  setRef: (index: number) => Ref<HTMLElement>;
  current: number;
  originPanel: number;
  onOpenCover: () => void;
  onBackToCover: () => void;
  boardOpen: boolean;
  onOpenBoard: (missions: MissionId[]) => void;
}

export function PageStack({ setRef, current, originPanel, onOpenCover, onBackToCover, boardOpen, onOpenBoard }: PageStackProps) {
  const originAt = pageIndex('origin-story');
  const powersAt = pageIndex('powers-abilities');
  return (
    <>
      {PAGES.map((page, i) => {
        const ref = setRef(i);
        switch (page.id) {
          case 'cover':
            return <MobileCover key={page.id} ref={ref} onOpen={onOpenCover} />;
          case 'personnel-file':
            return <PersonnelPage key={page.id} ref={ref} />;
          case 'origin-story':
            return (
              <OriginStoryPage
                key={page.id}
                ref={ref}
                panel={originPanel}
                nearby={Math.abs(current - originAt) <= 1}
                active={current === originAt}
              />
            );
          case 'powers-abilities':
            return <PowersPage key={page.id} ref={ref} active={current === powersAt} />;
          case 'battle-grodivo':
            return <BattleGrodivo key={page.id} ref={ref} />;
          case 'battle-peopleready':
            return <BattlePeopleReady key={page.id} ref={ref} />;
          case 'battle-ezlinks':
            return <BattleEzlinks key={page.id} ref={ref} />;
          case 'battle-early-career':
            return <BattleEarlyCareer key={page.id} ref={ref} />;
          case 'case-file-dossier':
            return <CaseFileDossier key={page.id} ref={ref} />;
          case 'case-file-loop':
            return <CaseFileLoop key={page.id} ref={ref} />;
          case 'mighty-allies':
            return <AlliesPage key={page.id} ref={ref} />;
          case 'ad-page':
            return <MobileAdPage key={page.id} ref={ref} boardOpen={boardOpen} onOpenBoard={onOpenBoard} />;
          case 'contact':
            return <ContactPage key={page.id} ref={ref} onBackToCover={onBackToCover} />;
        }
      })}
    </>
  );
}
