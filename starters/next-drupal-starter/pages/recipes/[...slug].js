import { NextSeo } from "next-seo";
import { IMAGE_URL } from "../../lib/constants.js";
import {
  getCurrentLocaleStore,
  globalDrupalStateAuthStores,
} from "../../lib/drupalStateContext.js";
import { isMultiLanguage } from "../../lib/isMultiLanguage";
import { getPreview } from "../../lib/getPreview";
import Link from "next/link";
import Image from "next/image";
import Layout from "../../components/layout";

// This file can safely be removed if the Drupal
// instance is not sourcing Umami data
export default function RecipeTemplate({ recipe, hrefLang }) {
  const imgSrc = recipe?.field_media_image?.field_media_image?.uri?.url || "";

  return (
    <Layout>
      <NextSeo
        title="Decoupled Next Drupal Demo"
        description="Generated by create next app."
        languageAlternates={hrefLang || false}
      />
      <article className="prose lg:prose-xl mt-10 mx-auto h-fit p-4 sm:p-0">
        <header>
          <h1>{recipe.title}</h1>
          <div className="flex flex-row justify-between">
            <Link passHref href="/recipes">
              <a className="font-normal">Recipes &rarr;</a>
            </Link>
            <span className="text pb-2 pr-3 text-sm text-slate-400">
              {recipe.field_recipe_category[0].name}
            </span>
          </div>
        </header>
        {imgSrc ? (
          <div className="relative max-w-lg mx-auto min-w-full h-[50vh] rounded-lg shadow-lg overflow-hidden mt-12 mb-10">
            <Image
              src={IMAGE_URL + imgSrc}
              layout="fill"
              objectFit="cover"
              alt={recipe.title}
            />
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row">
          <section className="flex flex-col min-w-fit sm:border-r-2 pr-4">
            <h2>Ingredients</h2>
            <ul>
              {recipe.field_ingredients?.map((ingredient, i) => {
                if (ingredient.startsWith("For")) {
                  return (
                    <li className="list-none" key={i}>
                      <strong>{ingredient}</strong>
                    </li>
                  );
                } else {
                  return <li key={i}>{ingredient}</li>;
                }
              })}
            </ul>
          </section>
          <section className="flex flex-col pl-4">
            <h2 className="ml-4">Directions</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: recipe.field_recipe_instruction.value,
              }}
            />
          </section>
        </div>
      </article>
    </Layout>
  );
}

export async function getStaticPaths(context) {
  const { locales } = context;
  // TODO - locale increases the complexity enough here that creating a usePaths
  // hook would be a good idea.
  // Get paths for each locale.
  const pathsByLocale = locales.map(async (locale) => {
    const store = getCurrentLocaleStore(locale, globalDrupalStateAuthStores);

    try {
      const recipes = await store.getObject({
        objectName: "node--recipe",
        query: `
          {
            id
            path {
              alias
            }
          }
        `,
      });

      return recipes.map((recipe) => {
        const match = recipe.path.alias.match(/^\/recipes\/(.*)$/);
        const slug = match[1];

        return { params: { slug: [slug] }, locale: locale };
      });
    } catch (error) {
      console.error("No recipes found: ", error);
      return null;
    }
  });

  // Resolve all promises returned as part of pathsByLocale.
  let paths = await Promise.all(pathsByLocale).then((values) => {
    // Flatten the array of arrays into a single array.
    return [].concat(...values);
  });

  if (paths[0] === null) {
    // clear paths so if there are no
    // recipes, no pages will attempt
    // to render at build time.
    paths = [];
  }

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps(context) {
  const { locales, locale } = context;
  const multiLanguage = isMultiLanguage(locales);
  const lang = context.preview ? context.previewData.previewLang : locale;
  const store = getCurrentLocaleStore(lang, globalDrupalStateAuthStores);

  const slug = `/recipes/${context.params.slug[0]}`;

  // clear params to prevent duplicates
  store.params.clear();
  store.params.addInclude([
    "field_media_image.field_media_image",
    "field_recipe_category",
  ]);
  context.preview && (await getPreview(context, "node--recipe"));

  try {
    const recipe = await store.getObjectByPath({
      objectName: "node--recipe",
      path: `${multiLanguage ? lang : ""}${slug}`,
      query: `{
        id
        title
        field_ingredients
        field_recipe_instruction
        field_summary
        field_media_image
        field_recipe_category {
          name
        }
        path {
          alias
          langcode
        }
      }`,
      // if preview is true, force a fetch to Drupal
      refresh: context.preview
    });

    store.params.clear();

    if (!recipe) {
      return { props: {} };
    }

    const origin = process.env.NEXT_PUBLIC_FRONTEND_URL;
    // Load all the paths for the current recipe.
    const paths = locales.map(async (locale) => {
      const storeByLocales = getCurrentLocaleStore(
        locale,
        globalDrupalStateAuthStores
      );
      storeByLocales.params.clear();
      const { path } = await storeByLocales.getObject({
        objectName: "node--recipe",
        id: recipe.id,
      });
      return path;
    });

    // Resolve all promises returned as part of paths
    // and prepare hrefLang.
    const hrefLang = await Promise.all(paths).then((values) => {
      return values.map((value) => {
        return {
          hrefLang: value.langcode,
          href: origin + "/" + value.langcode + value.alias,
        };
      });
    });

    return {
      props: {
        recipe,
        hrefLang,
        revalidate: 60,
      },
    };
  } catch (error) {
    console.error("Unable to fetch recipe: ", error);
    return {
      props: {},
    };
  }
}
