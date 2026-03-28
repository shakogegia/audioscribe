"use client"

import dynamic from "next/dynamic"

const Book = dynamic(() => import("./book"), { ssr: false })

export default Book
