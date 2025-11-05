import React from "react";
import Image from "next/image";
import Link from "next/link";

interface Props {
  isMobile?: boolean;
}

const Logo = ({ isMobile }: Props) => {
  return (
    <Link href={"/"}>
      <div className="flex items-center gap-2">
        <Image src={"/images/logo.png"} width={26} height={26} alt="logo" />
        {!isMobile ? (
          <h1 className="font-montserrat text-3xl leading-[90.3%] font-normal tracking-[-0.875px] text-black not-italic sm:text-[35px]">
            UseNotes
          </h1>
        ) : null}
      </div>
    </Link>
  );
};

export default Logo;
