import Image from "next/image";

export function AuthSidebar() {
  return (
    <div className="hidden lg:flex relative w-1/2 h-screen">
      <Image
        src="/images/auth_banner.svg"
        alt="Auth Banner"
        fill
        priority
        className="object-cover"
      />

      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-1.5 shadow-lg">
          <span className="text-xs font-mono text-white">
            v{process.env.NEXT_PUBLIC_APP_VERSION || "0.0.1"}
          </span>
        </div>
      </div>
    </div>
  );
}
