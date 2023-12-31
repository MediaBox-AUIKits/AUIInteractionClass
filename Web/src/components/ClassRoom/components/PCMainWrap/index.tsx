import React, {
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useState,
  CSSProperties,
} from 'react';
import ResizeObserver from 'resize-observer-polyfill';
import { StreamWidth, StreamHeight } from '../../constants';

export const PCMainWrapContext = React.createContext<{
  rendererStyle?: CSSProperties;
}>({
  rendererStyle: undefined,
});

const RenderRatio = StreamWidth / StreamHeight;

interface IProps {
  className?: string;
  children: React.ReactNode;
}

const PCMainWrap: React.FC<IProps> = props => {
  const { className, children } = props;
  const wrapEl = useRef<HTMLDivElement | null>(null);
  const [rendererStyle, setRendererStyle] = useState<CSSProperties>();

  const updateRenderStyle = useCallback(
    (wrapWidth: number, wrapHeight: number) => {
      const wrapRatio = wrapWidth / wrapHeight;
      let width = wrapWidth;
      let height = wrapHeight;
      if (wrapRatio > RenderRatio) {
        width = Math.round(wrapHeight * RenderRatio);
      } else {
        height = Math.round(wrapWidth / RenderRatio);
      }
      setRendererStyle({
        width,
        height,
      });
    },
    []
  );

  const resizeObserver = useMemo(() => {
    return new ResizeObserver(entries => {
      for (let entry of entries) {
        const cr = entry.contentRect;
        updateRenderStyle(cr.width, cr.height);
      }
    });
  }, []);

  useEffect(() => {
    if (wrapEl.current) {
      resizeObserver.observe(wrapEl.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={wrapEl} className={className}>
      <PCMainWrapContext.Provider
        value={{
          rendererStyle,
        }}
      >
        {children}
      </PCMainWrapContext.Provider>
    </div>
  );
};

export default PCMainWrap;
