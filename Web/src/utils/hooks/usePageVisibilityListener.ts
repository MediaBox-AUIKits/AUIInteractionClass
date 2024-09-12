import { useEffect } from 'react';

interface IPageVisibilityListener {
  onVisible?: () => void;
  onHidden?: () => void;
}

const handleDocumentVisiblityChange =
  (props?: IPageVisibilityListener) => () => {
    if (document.visibilityState === 'visible') {
      props?.onVisible?.();
    } else if (document.visibilityState === 'hidden') {
      props?.onHidden?.();
    }
  };

export default function usePageVisibilityListener(
  props?: IPageVisibilityListener,
) {
  useEffect(() => {
    const listener = handleDocumentVisiblityChange(props);
    document.addEventListener('visibilitychange', listener);

    return () => {
      document.removeEventListener('visibilitychange', listener);
    };
  }, []);
}
