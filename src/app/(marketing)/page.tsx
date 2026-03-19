import { routes } from "@/config/routes";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Influro</h1>
      <p className="mt-2 text-gray-600">Influencer campaign tracking.</p>
      <nav className="mt-6 flex gap-4 text-sm font-medium">
        <Link
          href={routes.login}
          className="text-indigo-600 hover:text-indigo-500"
        >
          Log in
        </Link>
        <Link
          href={routes.signup}
          className="text-indigo-600 hover:text-indigo-500"
        >
          Sign up
        </Link>
        <Link
          href={routes.dashboard}
          className="text-gray-600 hover:text-gray-900"
        >
          Dashboard
        </Link>
      </nav>
    </main>
  );
}
