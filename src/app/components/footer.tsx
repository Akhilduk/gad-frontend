// components/Footer.js
import Image from 'next/image';
export function Footer() {
  return (
    <footer className="py-3 bg-primary-500 border-t dark:bg-gray-950 dark:border-neutral-900 dark:text-neutral-800">
      <div className="container mx-auto">
        <div className="flex flex-wrap justify-between items-center">
          {/* Left Logo */}
          <div className="w-full md:w-1/6 flex justify-center mb-4 md:mb-0">
            <a
              href="https://duk.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-100"
              title="Digital University Kerala"
            >
              <div className="rounded-full bg-white text-center p-2 w-[200px]">
                <Image
                  src="/images/logos/duk-logo.png"
                  alt="Digital University Kerala"
                  className="mx-auto" width={143} height={50}
                />
              </div>
            </a>
          </div>

          {/* Center Text */}
          <div className="w-full md:w-4/6 text-center">
            <p className="mb-2 text-sm text-neutral-100 dark:text-neutral-300">
              Designed, Developed, and Implemented by{" "}
              <a
                href="https://duk.ac.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-100 hover:underline dark:text-neutral-300"
              >
                Centre for Digital Innovation and Product Development (CDIPD)
              </a>
            </p>
            <p className="text-xs text-neutral-100 dark:text-neutral-300">
              A Centre of Excellence Established by{" "}
              <a
                href="https://duk.ac.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-100 hover:underline dark:text-neutral-300"
              >
                Digital University Kerala
              </a>
            </p>
          </div>

          {/* Right Logo */}
          <div className="w-full md:w-1/6 flex justify-center">
            <a
              href="https://duk.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-800"
              title="Digital University Kerala"
            >
              <div className="rounded-full bg-white text-center p-2 w-[200px]">
                <Image
                  src="/images/logos/cdipd-logo.jpg"
                  alt="Digital University Kerala"
                  className="mx-auto" width={143} height={50}
                />
              </div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
