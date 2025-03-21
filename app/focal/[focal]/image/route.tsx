import { getPhotosCached } from '@/photo/cache';
import {
  IMAGE_OG_DIMENSION_SMALL,
  MAX_PHOTOS_TO_SHOW_PER_CATEGORY,
} from '@/image-response';
import { getIBMPlexMono } from '@/app/font';
import { ImageResponse } from 'next/og';
import { getImageResponseCacheControlHeaders } from '@/image-response/cache';
import FocalLengthImageResponse from
  '@/image-response/FocalLengthImageResponse';
import { formatFocalLength, getFocalLengthFromString } from '@/focal';
import { GENERATE_STATIC_PARAMS_LIMIT } from '@/photo/db';
import { getUniqueFocalLengths } from '@/photo/db/query';
import { shouldGenerateStaticParamsForCategory } from '@/app/config';

export let generateStaticParams:
  (() => Promise<{ focal: string }[]>) | undefined = undefined;

if (shouldGenerateStaticParamsForCategory('focal-lengths', 'image')) {
  generateStaticParams = async () => {
    const focalLengths= await getUniqueFocalLengths();
    return focalLengths
      .map(({ focal }) => ({ focal: formatFocalLength(focal)! }))
      .slice(0, GENERATE_STATIC_PARAMS_LIMIT);
  };
}

export async function GET(
  _: Request,
  context: { params: Promise<{ focal: string }> },
) {
  const focalString = (await context.params).focal;

  const focal = getFocalLengthFromString(focalString);

  const [
    photos,
    { fontFamily, fonts },
    headers,
  ] = await Promise.all([
    getPhotosCached({ limit: MAX_PHOTOS_TO_SHOW_PER_CATEGORY, focal }),
    getIBMPlexMono(),
    getImageResponseCacheControlHeaders(),
  ]);

  const { width, height } = IMAGE_OG_DIMENSION_SMALL;

  return new ImageResponse(
    <FocalLengthImageResponse {...{
      focal,
      photos,
      width,
      height,
      fontFamily,
    }}/>,
    { width, height, fonts, headers },
  );
}
