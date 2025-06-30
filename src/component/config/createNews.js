import { db } from "../../firebaseconfig";
import { doc, setDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";

const createSlug = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

const createUniqueSlug = async (title, docId) => {
  let slug = createSlug(title || `news-${docId}`);
  let suffix = 1;
  let uniqueSlug = slug;
  while (true) {
    const q = query(collection(db, "news"), where("slug", "==", uniqueSlug));
    const snapshot = await getDocs(q);
    if (snapshot.empty) break;
    uniqueSlug = `${slug}-${suffix++}`;
  }
  return uniqueSlug;
};

const createNews = async (newsData) => {
  try {
    const newsRef = doc(collection(db, "news"));
    const slug = await createUniqueSlug(newsData.judul || newsData.title, newsRef.id);
    await setDoc(newsRef, {
      ...newsData,
      slug,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0,
      komentar: 0,
    });
    console.log(`News created with ID: ${newsRef.id}, Slug: ${slug}`);
    return newsRef.id;
  } catch (error) {
    console.error("Error creating news:", error);
    throw error;
  }
};

export { createNews };
