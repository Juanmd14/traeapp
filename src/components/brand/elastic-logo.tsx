"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/logo";

type Props = {
  className?: string;
  href?: string;
};

export function ElasticLogo({ className, href = "/" }: Props) {
  return (
    <motion.div
      whileHover={{ scale: 1.1, y: -3 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 520, damping: 12 }}
      className="inline-block w-fit"
    >
      <Link href={href} aria-label="Trae App — inicio">
        <Logo className={className} priority />
      </Link>
    </motion.div>
  );
}
