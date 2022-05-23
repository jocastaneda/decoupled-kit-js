import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Paginator({
  data,
  totalPages,
  totalItems,
  itemsPerPage,
  routing,
}) {
  // configurable breakpoints
  // This value will be the start of the seperator.
  const [breakStart, setBreakStart] = useState(6);
  // This value will be the button to start with after seperator
  const breakEnd = 12;
  // how many buttons to add when the seperator is clicked
  const breakAdd = 6;

  const router = useRouter();
  // get current path from router.pathname
  // and trim off catchalls
  const currentRoute = routing && router.pathname.replace(/\/\[\[.*\]\]$/, "");

  const [currentPageQuery, setCurrentPageQuery] = useState(
    Number(router.query.page) || 1
  );

  const [offset, setOffset] = useState((currentPageQuery - 1) * itemsPerPage);
  const [currentItems, setCurrentItems] = useState([]);

  // since we fetch ALL items, filtering the current items client side
  // further reduces API calls to the server
  useEffect(() => {
    setCurrentItems(
      data.slice(
        (currentPageQuery - 1) * itemsPerPage,
        itemsPerPage * currentPageQuery
      )
    );

    // set the new offset
    const newOffset =
      ((currentPageQuery > 0 && currentPageQuery - 1) * itemsPerPage) %
      totalItems;
    setOffset(Number(newOffset));
  }, [data, offset, itemsPerPage, breakStart, currentPageQuery, totalItems]);

  // track window width to appropriately hide and show buttons on small viewports
  const [windowWidth, setWindowWidth] = useState();
  useEffect(() => {
    setWindowWidth(window.innerWidth);
    window.addEventListener("resize", () => {
      setWindowWidth(window.innerWidth);
    });
  }, []);
  // Render the currentItems to the page
  const RenderData = () => {
    return currentItems.map((data) => {
      return (
        <article
          key={data.id}
          className="flex flex-col p-3 w-fit mx-auto mb-10"
        >
          {data?.title && (
            <h2 className="justify-start my-auto text-2xl mb-2">
              {data.title}
            </h2>
          )}
          {data?.body?.value && (
            <p className="max-w-prose my-2">
              {data?.body.value.substr(0, 150)}...
            </p>
          )}
        </article>
      );
    });
  };

  const handlePageClick = (event) => {
    let clickedPage;
    const {
      target: { id },
    } = event;

    if (id === "next-btn") {
      // set new offset
      offset < totalItems - itemsPerPage &&
        setOffset(Number(offset) + Number(itemsPerPage));
      // set the current page
      currentPageQuery < totalPages &&
        setCurrentPageQuery(Number(currentPageQuery + 1));
    } else if (id === "back-btn") {
      // set new offset
      offset >= 0 && setOffset(offset - itemsPerPage);
      // set the current page
      currentPageQuery > 1 && setCurrentPageQuery(Number(currentPageQuery - 1));
    } else {
      // the number of the page button clicked
      const clickedPage = Number(event.target.innerHTML);
      setCurrentPageQuery(clickedPage);
    }

    // if routing is enabled, use shallow routing
    // to change the page URL
    routing &&
      router.push(
        `${currentRoute}/${currentPageQuery}`,
        `${currentRoute}/${currentPageQuery}`,
        {
          shallow: true,
        }
      );
  };

  const RenderButtons = () => {
    if (totalPages <= 1) {
      // if there is only one page
      // don't render any buttons
      return null;
    }
    const buttons = [];

    // Create buttons given the number of
    // total pages
    for (let i = 0; i < totalPages; i++) {
      const pageNumber = Number(i + 1);
      const defaultButton = (
        <button
          className={`
          ${currentPageQuery === pageNumber ? "block" : "hidden md:block"}
          h-16 w-12 border-t-2 border-b-2 border-black bg-white hover:bg-blue-300 focus:bg-blue-200 focus:border-blue-300 ${
            currentPageQuery === pageNumber && "border-blue-700 border-2"
          }
          `}
          onClick={handlePageClick}
          key={pageNumber}
        >
          {pageNumber}
        </button>
      );

      // seperator button
      if (i === breakStart) {
        if (breakStart + breakAdd >= totalPages) {
          buttons.push(defaultButton);
          continue;
        }
        buttons.push(
          <button
            className={`hidden md:block h-16 w-12 border-2 border-black bg-slate-200 hover:bg-blue-300 focus:bg-blue-200 focus:border-blue-300"
            }`}
            onClick={() => setBreakStart(breakStart + breakAdd)}
            key={"..."}
          >
            ...
          </button>
        );
      }
      // if we have a breakStart, don't render the middle buttons
      if (pageNumber >= breakStart && pageNumber < breakEnd) {
        if (windowWidth < 768) {
          buttons.push(defaultButton);
        }
        continue;
      }
      buttons.push(defaultButton);
    }
    // returns the row of buttons
    return (
      <div className="flex flex-row justify-center mx-auto mt-auto mb-4 grow">
        {/* back button */}
        <button
          className="h-16 w-12 disabled:bg-gray-500 hover:bg-blue-300 focus:bg-blue-200 focus:border-blue-300 border-l-2 border-t-2 border-b-2 border-black bg-white"
          id="back-btn"
          disabled={offset === 0}
          onClick={handlePageClick}
        >
          {"<"}
        </button>
        {/* map buttons[] */}
        {buttons.map((btn) => btn)}
        {/* next button */}
        <button
          className="h-16 w-12 disabled:bg-gray-500 hover:bg-blue-300 focus:bg-blue-200 focus:border-blue-300  border-r-2 border-t-2 border-b-2 border-black bg-white"
          id="next-btn"
          disabled={offset >= totalItems - itemsPerPage}
          onClick={handlePageClick}
        >
          {">"}
        </button>
      </div>
    );
  };
  return (
    <div className="max-w-screen-md">
      <h3 className="mb-8 prose-sm">
        Page {currentPageQuery}/{totalPages}
      </h3>
      <section>
        <RenderData />
      </section>
      <div className="sticky lg:bottom-12 bottom-4">
        <RenderButtons />
      </div>
    </div>
  );
}
