import { globalDrupalStateAuthStores } from "../../lib/drupalStateContext";

const preview = async (req, res) => {
  console.log("req.query:", req.query);

  // Check the secret and next parameters
  // This secret should only be known to this API route and the CMS
  if (req.query.secret !== process.env.PREVIEW_SECRET || !req.query.slug) {
    return res.status(401).json({ message: "Invalid token" });
  }

  // returns the store that matches the locale found in the requested url
  // or the only store if using a monolingual backend
  const [store] = globalDrupalStateAuthStores.filter(({ defaultLocale }) => {
    const regex = new RegExp(`/${defaultLocale}/`);
    return defaultLocale ? regex.test(req.url) : true;
  });

  // get the object name from the slug
  const regex = new RegExp(
    `^(?:/${store.defaultLocale}/|/)(?<objectName>.*)/.*$`
  );
  const matches = req.query.slug.match(regex);

  const objectName = matches.groups.objectName.replace(/s$/, ""); // remove plural

  let content;
  try {
    // verify the content exists
    content = await store.getObjectByPath({
      objectName: `node--${objectName}`,
      path: req.query.slug,
    });
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }

  // If the slug doesn't exist prevent preview mode from being enabled
  if (!content) {
    return res.status(401).json({ message: "Invalid slug" });
  }

  // Enable Preview Mode by setting a cookie
  if (req.query.resourceVersionId) {
    res.setPreviewData({ resourceVersionId: req.query.resourceVersionId });
  } else if (req.query.key) {
    res.setPreviewData({ key: req.query.key });
  } else {
    res.setPreviewData({});
  }

  // Redirect to the path from the fetched content
  res.redirect(content.path.alias);
};

export default preview;
