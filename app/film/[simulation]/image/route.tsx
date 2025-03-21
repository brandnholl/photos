import { getPhotosCached } from '@/photo/cache';
import {
  IMAGE_OG_DIMENSION_SMALL,
  MAX_PHOTOS_TO_SHOW_PER_CATEGORY,
} from '@/image-response';
import FilmSimulationImageResponse from
  '@/image-response/FilmSimulationImageResponse';
import { FilmSimulation } from '@/simulation';
import { getIBMPlexMono } from '@/app/font';
import { ImageResponse } from 'next/og';
import { getImageResponseCacheControlHeaders } from '@/image-response/cache';
import { GENERATE_STATIC_PARAMS_LIMIT } from '@/photo/db';
import { getUniqueFilmSimulations } from '@/photo/db/query';
import { shouldGenerateStaticParamsForCategory } from '@/app/config';

export let generateStaticParams:
  (() => Promise<{ simulation: FilmSimulation }[]>) | undefined = undefined;

if (shouldGenerateStaticParamsForCategory('films', 'image')) {
  generateStaticParams = async () => {
    const simulations = await getUniqueFilmSimulations();
    return simulations
      .map(({ simulation }) => ({ simulation }))
      .slice(0, GENERATE_STATIC_PARAMS_LIMIT);
  };
}

export async function GET(
  _: Request,
  context: { params: Promise<{ simulation: FilmSimulation }> },
) {
  const { simulation } = await context.params;

  const [
    photos,
    { fontFamily, fonts },
    headers,
  ] = await Promise.all([
    getPhotosCached({ limit: MAX_PHOTOS_TO_SHOW_PER_CATEGORY, simulation }),
    getIBMPlexMono(),
    getImageResponseCacheControlHeaders(),
  ]);

  const { width, height } = IMAGE_OG_DIMENSION_SMALL;

  return new ImageResponse(
    <FilmSimulationImageResponse {...{
      simulation,
      photos,
      width,
      height,
      fontFamily,
    }}/>,
    { width, height, fonts, headers },
  );
}
