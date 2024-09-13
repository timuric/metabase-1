(ns metabase.embed.settings
  "Settings related to embedding Metabase in other applications."
  (:require
   [clojure.string :as str]
   [crypto.random :as crypto-random]
   [metabase.analytics.snowplow :as snowplow]
   [metabase.models.setting :as setting :refer [defsetting]]
   [metabase.util.embed :as embed]
   [metabase.util.i18n :as i18n :refer [deferred-tru]]
   [metabase.util.malli :as mu]
   [toucan2.core :as t2]))

;; embedding-app-origin is required by make-embedding-toggle-setter (and vice versa)
(declare embedding-app-origin)

(mu/defn- make-embedding-toggle-setter
  "Creates a boolean setter for various boolean embedding-enabled flavors, all tracked by snowplow."
  [setting-key :- :keyword event-name :- :string]
  (fn [new-value]
    (when (not= new-value (setting/get-value-of-type :boolean setting-key))
      (setting/set-value-of-type! :boolean setting-key new-value)
      (when (and new-value (str/blank? (embed/embedding-secret-key)))
        (embed/embedding-secret-key! (crypto-random/hex 32)))
      (snowplow/track-event! ::snowplow/embed_share
                             {:event  (keyword (str event-name "-" (if new-value "enabled" "disabled")))
                              :embedding-app-origin-set   (boolean (embedding-app-origin))
                              :number-embedded-questions  (t2/count :model/Card :enable_embedding true)
                              :number-embedded-dashboards (t2/count :model/Dashboard :enable_embedding true)}))
    new-value))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; Embed Settings ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defsetting enable-embedding
  (deferred-tru "Allow admins to securely embed questions and dashboards within other applications?")
  :type       :boolean
  :default    false
  :visibility :authenticated
  :export?    true
  :audit      :getter
  :deprecated "0.51.0"
  :setter     (make-embedding-toggle-setter :enable-embedding "embedding"))

(defsetting embedding-app-origin
  (deferred-tru "Allow this origin to embed the full Metabase application.")
  ;; This value is usually gated by [[enable-embedding]]
  :feature    :embedding
  :type       :string
  :export?    false
  :visibility :public
  :audit      :getter)

(defsetting enable-embedding-sdk
  (deferred-tru "Allow admins to embed Metabase via the SDK?")
  :type       :boolean
  :default    false
  :visibility :authenticated
  :export?    false
  :audit      :getter
  :setter     (make-embedding-toggle-setter :enable-embedding-sdk "sdk-embedding"))

(mu/defn- ignore-localhost :- :string
  "Remove localhost:* or localhost:<port> from the list of origins."
  [s :- [:maybe :string]]
  (->> (str/split (or s "") #"\s+")
       (remove #(re-matches #"localhost:(\*|\d+)" %))
       (str/join " ")
       str/trim))

(mu/defn- add-localhost [s :- [:maybe :string]] :- :string
  (->> s ignore-localhost (str "localhost:* ") str/trim))

(defsetting embedding-app-origins-sdk
  (deferred-tru "Allow this origin to embed Metabase SDK")
  :feature    :embedding-sdk
  :type       :string
  :export?    false
  :visibility :public
  :encryption :never
  :audit      :getter
  :getter    (fn embedding-app-origins-sdk-getter []
               (when (enable-embedding-sdk)
                 (add-localhost (setting/get-value-of-type :string :embedding-app-origins-sdk))))
  :setter   (fn embedding-app-origins-sdk-setter [new-value]
              (->> new-value
                   ignore-localhost
                   (setting/set-value-of-type! :string :embedding-app-origins-sdk)
                   add-localhost)))

(defsetting enable-embedding-static
  (deferred-tru "Allow admins to embed Metabase via static embedding?")
  :type       :boolean
  :default    false
  :visibility :authenticated
  :export?    false
  :audit      :getter
  :setter     (make-embedding-toggle-setter :enable-embedding-static "static-embedding"))

(defsetting enable-embedding-interactive
  (deferred-tru "Allow admins to embed Metabase via interactive embedding?")
  :feature    :embedding
  :type       :boolean
  :default    false
  :visibility :authenticated
  :export?    false
  :audit      :getter
  :setter     (make-embedding-toggle-setter :enable-embedding-interactive "interactive-embedding"))

;; settings for the embedding homepage
(defsetting embedding-homepage
  (deferred-tru "Embedding homepage status, indicating if it's visible, hidden or has been dismissed")
  :type       :keyword
  :default    :hidden
  :export?    true
  :visibility :admin)

(defsetting setup-embedding-autoenabled
  (deferred-tru "Indicates if embedding has enabled automatically during the setup because the user was interested in embedding")
  :type       :boolean
  :default    false
  :export?    true
  :visibility :admin)

(defsetting setup-license-active-at-setup
  (deferred-tru "Indicates if at the end of the setup a valid license was active")
  :type       :boolean
  :default    false
  :export?    true
  :visibility :admin)
