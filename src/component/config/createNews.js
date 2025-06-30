import { db } from "../../firebaseconfig";
import { doc, setDoc, collection, serverTimestamp, query, where, getDocs, updateDoc } from "firebase/firestore";

const createSlug = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

const createUniqueSlug = async (title, docId, existingSlug = null) => {
  let slug = createSlug(title || `news-${docId}`);
  let suffix = 1;
  let uniqueSlug = existingSlug || slug; // Use existing slug if updating
  while (true) {
    const q = query(collection(db, "news"), where("slug", "==", uniqueSlug));
    const snapshot = await getDocs(q);
    if (snapshot.empty || (snapshot.docs[0].id === docId && snapshot.size === 1)) break;
    uniqueSlug = `${slug}-${suffix++}`;
  }
  return uniqueSlug;
};

const createNews = async (newsData, isUpdate = false) => {
  try {
    const newsRef = doc(collection(db, "news"));
    let slug = isUpdate && newsData.slug ? await createUniqueSlug(newsData.judul || newsData.title, newsRef.id, newsData.slug) : await createUniqueSlug(newsData.judul || newsData.title, newsRef.id);
    const dataToSave = {
      ...newsData,
      slug,
      updatedAt: serverTimestamp(),
      views: newsData.views || 0,
      komentar: newsData.komentar || 0,
    };
    if (!isUpdate) {
      dataToSave.createdAt = serverTimestamp();
    }
    await setDoc(newsRef, dataToSave, { merge: true });
    console.log(`News ${isUpdate ? 'updated' : 'created'} with ID: ${newsRef.id}, Slug: ${slug}`);
    return newsRef.id;
  } catch (error) {
    console.error("Error creating/updating news:", error);
    throw error;
  }
};

export { createNews };