import { useEffect, useState } from "react";
import { DrupalState } from "@pantheon-systems/drupal-kit";
import { useRouter } from "next/router";

import Paginator from "../../../components/paginator";
import Head from "next/head";
import Layout from "../../../components/layout";

// To use your configured backend, use:
// const drupalUrl = DRUPAL_URL

// Example paginated data set
const drupalUrl = "https://dev-ds-demo.pantheonsite.io";

export default function Pagination({
  data,
  totalPages,
  totalItems,
  itemsPerPage,
}) {
  return (
    <Layout>
      <Head>
        <title>Pagination example</title>
        <meta name="description" content="Powered by Pantheon Decoupled Kit" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="prose container min-w-full min-h-screen max-w-screen mx-auto">
        <main className="flex mx-auto flex-col">
          <section className="mx-auto">
            <h1 className="my-10">Pagination example</h1>
            <Paginator
              data={data}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              routing
            />
          </section>
        </main>
      </div>
    </Layout>
  );
}

export async function getStaticPaths() {
  const store = new DrupalState({
    apiBase: drupalUrl,
    apiPrefix: "jsonapi",
    defaultLocale: "en",
    debug: process.env.DEBUG_MODE || false,
  });
  const data = await store.getObject({
    objectName: "node--ds_example",
    all: true,
    query: `{
      title
      id
      body {
        value
      }
    }`,
  });
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const arr = Array.from(Array(totalPages).keys());

  const paths = arr.map((page) => ({
    params: { page: [(page + 1).toString()] },
  }));
  // allows for  examples/pagination
  paths.push({ params: { page: [""] } });

  return {
    paths: paths,
    fallback: false,
  };
}

export async function getStaticProps() {
  const store = new DrupalState({
    apiBase: drupalUrl,
    apiPrefix: "jsonapi",
    defaultLocale: "en",
    debug: process.env.DEBUG_MODE || false,
  });

  // using a query here results in a payload of 641kb, down from 2.09mb without a query!
  const data = await store.getObject({
    objectName: "node--ds_example",
    query: `{
      title
      id
      body {
        value
      }
    }`,
    all: true,
  });

  // configurable itemsPerPage
  const itemsPerPage = 10;

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const totalItems = data.length;

  return {
    props: {
      data,
      totalItems,
      itemsPerPage,
      totalPages,
      revalidate: 60,
    },
  };
}
