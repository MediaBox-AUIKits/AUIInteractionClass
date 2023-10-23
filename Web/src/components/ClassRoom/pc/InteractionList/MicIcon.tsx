import React, { useState, useMemo, useEffect, useRef, useContext } from 'react';
import {
  MicCloseSvg,
  MicNormalSvg,
  MicDisableSvg,
} from '../../components/icons';
import styles from './index.less';

interface MicProps {
  disabled: boolean;
  closed: boolean;
}

const MicIcon: React.FC<MicProps> = (props: MicProps) => {
  const { disabled, closed } = props;
  return disabled ? (
    <MicDisableSvg />
  ) : closed ? (
    <MicCloseSvg />
  ) : (
    <MicNormalSvg />
  );
};

export default MicIcon;
