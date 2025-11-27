import { Outlet } from "react-router";

function AuthPage() {
  return (
    <div className="flex h-screen">
      <div className="flex-1 bg-cover bg-primary bg-no-repeat bg-fixed text-white hidden xl:block">
        <div className="flex w-[75%] h-full justify-center items-start flex-col mx-auto gap-4">
          <h2 className="text-4xl font-semibold font-playfair pt-4">
            Make Your Banner
          </h2>
          <p className="font-medium font-montserrat">
            implement stunning banners effortlessly with your choice.
          </p>
          
        </div>
      </div>
      <div className="flex-1 h-full flex items-center justify-center">
        <Outlet />
      </div>
    </div>
  );
}

export default AuthPage;
