"use client";

export default function ColorTestPage() {
  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">
        Primary Color Theme (#3ECF8E)
      </h1>

      {/* Primary Color Palette */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Primary Color Palette
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-primary-50 p-4 rounded-lg border shadow-sm">
            <div className="font-medium text-gray-800">primary-50</div>
            <div className="text-sm text-gray-600">#f0fdf4</div>
          </div>
          <div className="bg-primary-100 p-4 rounded-lg border shadow-sm">
            <div className="font-medium text-gray-800">primary-100</div>
            <div className="text-sm text-gray-600">#dcfce7</div>
          </div>
          <div className="bg-primary-200 p-4 rounded-lg border shadow-sm">
            <div className="font-medium text-gray-800">primary-200</div>
            <div className="text-sm text-gray-600">#bbf7d0</div>
          </div>
          <div className="bg-primary-300 p-4 rounded-lg border shadow-sm">
            <div className="font-medium text-gray-800">primary-300</div>
            <div className="text-sm text-gray-600">#86efac</div>
          </div>
          <div className="bg-primary-400 p-4 rounded-lg border shadow-sm text-white">
            <div className="font-medium">primary-400</div>
            <div className="text-sm text-white/80">#4ade80</div>
          </div>
          <div className="bg-primary-500 p-4 rounded-lg border shadow-sm text-white">
            <div className="font-medium">primary-500 (Main)</div>
            <div className="text-sm text-white/80">#3ECF8E</div>
          </div>
          <div className="bg-primary-600 p-4 rounded-lg border shadow-sm text-white">
            <div className="font-medium">primary-600</div>
            <div className="text-sm text-white/80">#35b67f</div>
          </div>
          <div className="bg-primary-700 p-4 rounded-lg border shadow-sm text-white">
            <div className="font-medium">primary-700</div>
            <div className="text-sm text-white/80">#2c9d70</div>
          </div>
          <div className="bg-primary-800 p-4 rounded-lg border shadow-sm text-white">
            <div className="font-medium">primary-800</div>
            <div className="text-sm text-white/80">#228461</div>
          </div>
          <div className="bg-primary-900 p-4 rounded-lg border shadow-sm text-white">
            <div className="font-medium">primary-900</div>
            <div className="text-sm text-white/80">#1a6b51</div>
          </div>
        </div>
      </section>

      {/* Interactive Elements */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Interactive Elements
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">Buttons</h3>
            <button className="w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Primary Button
            </button>
            <button className="w-full border-2 border-primary-500 text-primary-600 hover:bg-primary-50 px-6 py-3 rounded-lg font-medium transition-colors">
              Outline Button
            </button>
            <button className="w-full bg-primary-100 text-primary-700 hover:bg-primary-200 px-6 py-3 rounded-lg font-medium transition-colors">
              Ghost Button
            </button>
          </div>

          {/* Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">Cards</h3>
            <div className="bg-white border border-primary-200 p-6 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                <h4 className="font-medium text-gray-900">Primary Card</h4>
              </div>
              <p className="text-gray-600">
                This card uses primary color accents
              </p>
            </div>
            <div className="bg-primary-50 border border-primary-200 p-6 rounded-lg">
              <h4 className="font-medium text-primary-900 mb-2">
                Light Primary Card
              </h4>
              <p className="text-primary-700">
                This card has a light primary background
              </p>
            </div>
          </div>

          {/* Form Elements */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">Form Elements</h3>
            <input
              type="text"
              placeholder="Enter text..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            />
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors">
              <option>Select an option</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
        </div>
      </section>

      {/* Status Colors */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Status & Alert Colors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-success-50 border border-success-200 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-success-500 rounded-full"></div>
              <span className="font-medium text-success-800">Success</span>
            </div>
            <p className="text-success-700 text-sm">
              Operation completed successfully
            </p>
          </div>
          <div className="bg-warning-50 border border-warning-200 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
              <span className="font-medium text-warning-800">Warning</span>
            </div>
            <p className="text-warning-700 text-sm">
              Please review this information
            </p>
          </div>
          <div className="bg-error-50 border border-error-200 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-error-500 rounded-full"></div>
              <span className="font-medium text-error-800">Error</span>
            </div>
            <p className="text-error-700 text-sm">An error has occurred</p>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section>
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">
          Typography with Primary Color
        </h2>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-primary-700">
            Heading 1 in Primary
          </h1>
          <h2 className="text-3xl font-semibold text-primary-600">
            Heading 2 in Primary
          </h2>
          <h3 className="text-2xl font-medium text-primary-500">
            Heading 3 in Primary
          </h3>
          <p className="text-lg text-gray-700">
            Regular text with{" "}
            <span className="text-primary-600 font-medium">
              primary color highlights
            </span>
            and{" "}
            <a
              href="#"
              className="text-primary-500 hover:text-primary-600 underline"
            >
              primary links
            </a>
            .
          </p>
          <blockquote className="border-l-4 border-primary-400 pl-6 py-2 bg-primary-50 rounded-r-lg">
            <p className="text-primary-800 italic">
              &ldquo;This is a quote styled with primary colors to demonstrate
              the theme consistency.&rdquo;
            </p>
          </blockquote>
        </div>
      </section>
    </div>
  );
}
