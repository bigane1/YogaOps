export const dynamic = "force-dynamic";

import { AdminPageFrame, isAdminLoggedIn } from "@/components/admin-page-frame";
import { BlogPostForm } from "@/components/blog-post-form";
import { listAdminBlogPosts } from "@/lib/blog";
import { ensureSeedData } from "@/lib/db";

export default async function AdminBlogPage() {
  await ensureSeedData();
  const isLogged = await isAdminLoggedIn();
  const blogPosts = isLogged ? await listAdminBlogPosts() : [];

  return (
    <AdminPageFrame title="Blog" intro="Articles du blog : couverture, texte et illustrations.">
      <section className="brand-card mt-8 rounded-xl p-6">
        <div className="mt-1">
          <BlogPostForm mode="create" />
        </div>
        <ul className="mt-6 space-y-4 text-sm">
          {blogPosts.map((post) => (
            <li key={post.id} className="brand-list-item p-3">
              <BlogPostForm mode="edit" post={post} />
            </li>
          ))}
        </ul>
      </section>
    </AdminPageFrame>
  );
}
