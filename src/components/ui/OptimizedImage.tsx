import { FC, ImgHTMLAttributes } from 'react';

/**
 * A lightweight image component that automatically enables
 * lazy‑loading and asynchronous decoding.  It forwards all
 * unknown props to the underlying <img> element so it can be used
 * as a drop‑in replacement for plain <img> tags.
 */
export const OptimizedImage: FC<ImgHTMLAttributes<HTMLImageElement>> = ({
  src,
  alt = '',
  loading = 'lazy',
  decoding = 'async',
  ...rest
}) => {
  return <img src={src} alt={alt} loading={loading} decoding={decoding} {...rest} />;
};

export default OptimizedImage;

