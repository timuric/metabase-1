(ns metabase.notification.system-event-test
  (:require
   [clojure.test :refer :all]
   [metabase.events :as events]
   [metabase.models.notification :as models.notification]
   [metabase.notification.test-util :as notification.tu]
   [metabase.public-settings :as public-settings]
   [metabase.test :as mt]
   [toucan2.core :as t2]))

(deftest system-event-e2e-test
  (testing "a system event that sends to an email channel with a custom template to an user recipient"
    (mt/with-model-cleanup [:model/Notification]
      (mt/with-temp [:model/ChannelTemplate tmpl {:channel_type :channel/email
                                                  :details      {:type    :email/mustache
                                                                 :subject "Welcome {{event-info.object.first_name}} to {{settings.site-name}}"
                                                                 :body    "Hello {{event-info.object.first_name}}! Welcome to {{settings.site-name}}!"}}
                     :model/User             {user-id :id} {:email "ngoc@metabase.com"}
                     :model/PermissionsGroup {group-id :id} {:name "Avengers"}
                     :model/PermissionsGroupMembership _ {:group_id group-id
                                                          :user_id user-id}]
        (let [rasta (mt/fetch-user :rasta)]
          (models.notification/create-notification!
           {:payload_type :notification/system-event}
           [{:type       :notification-subscription/system-event
             :event_name :event/user-invited}]
           [{:channel_type :channel/email
             :template_id  (:id tmpl)
             :recipients   [{:type    :notification-recipient/user
                             :user_id (mt/user->id :crowberto)}
                            {:type                 :notification-recipient/group
                             :permissions_group_id group-id}
                            {:type    :notification-recipient/external-email
                             :details {:email "hi@metabase.com"}}]}])
          (mt/with-temporary-setting-values
            [site-name "Metabase Test"]
            (mt/with-fake-inbox
              (events/publish-event! :event/user-invited {:object rasta})
              (let [email {:from    "notifications@metabase.com",
                           :subject "Welcome Rasta to Metabase Test"
                           :body    [{:type    "text/html; charset=utf-8"
                                      :content "Hello Rasta! Welcome to Metabase Test!"}]}]
                (is (=? {"crowberto@metabase.com" [email]
                         "ngoc@metabase.com"      [email]
                         "hi@metabase.com"        [email]}
                        @mt/inbox))))))))))

(deftest system-event-resouce-template-test
  (testing "a system event that sends to an email channel with a custom template to an user recipient"
    (mt/with-model-cleanup [:model/Notification]
      (mt/with-temp [:model/ChannelTemplate tmpl {:channel_type :channel/email
                                                  :details      {:type    :email/resource
                                                                 :subject "Welcome {{event-info.object.first_name}} to {{settings.site-name}}"
                                                                 :path    "notification/channel_template/hello_world"}}
                     :model/User             {user-id :id} {:email "ngoc@metabase.com"}
                     :model/PermissionsGroup {group-id :id} {:name "Avengers"}
                     :model/PermissionsGroupMembership _ {:group_id group-id
                                                          :user_id user-id}]
        (let [rasta (mt/fetch-user :rasta)]
          (models.notification/create-notification!
           {:payload_type :notification/system-event}
           [{:type       :notification-subscription/system-event
             :event_name :event/user-invited}]
           [{:channel_type :channel/email
             :template_id  (:id tmpl)
             :recipients   [{:type    :notification-recipient/user
                             :user_id (mt/user->id :crowberto)}
                            {:type                 :notification-recipient/group
                             :permissions_group_id group-id}
                            {:type    :notification-recipient/external-email
                             :details {:email "hi@metabase.com"}}]}])
          (mt/with-temporary-setting-values
            [site-name "Metabase Test"]
            (mt/with-fake-inbox
              (events/publish-event! :event/user-invited {:object rasta})
              (let [email {:from    "notifications@metabase.com",
                           :subject "Welcome Rasta to Metabase Test"
                           :body    [{:type    "text/html; charset=utf-8"
                                      :content "Hello Rasta! Welcome to Metabase Test!\n"}]}]
                (is (=? {"crowberto@metabase.com" [email]
                         "ngoc@metabase.com"      [email]
                         "hi@metabase.com"        [email]}
                        @mt/inbox))))))))))

(defn- publish-user-invited-event!
  [user invitor from-setup?]
  (events/publish-event! :event/user-invited {:object  (assoc user
                                                              :is_from_setup from-setup?
                                                              :invite_method "email")
                                              :details {:invitor invitor}}))

(deftest user-invited-event-send-email-test
  (testing "publish an :user-invited event will send an email"
    (doseq [from-setup? [true false]]
      (testing (format "from %s page" (if from-setup? "setup" "invite"))
        (is (= {:channel/email 1}
               (update-vals (notification.tu/with-captured-channel-send!
                              (publish-user-invited-event! (t2/select-one :model/User)
                                                           {:first_name "Ngoc"
                                                            :email      "ngoc@metabase.com"}
                                                           from-setup?))
                            count)))))))

(deftest user-invited-email-content-test
  (let [check (fn [sent-from-setup? expected-subject regexes]
                (let [email (mt/with-temporary-setting-values
                              [site-url "https://metabase.com"]
                              (-> (notification.tu/with-captured-channel-send!
                                    (publish-user-invited-event! (t2/select-one :model/User :email "crowberto@metabase.com")
                                                                 {:first_name "Ngoc" :email "ngoc@metabase.com"}
                                                                 sent-from-setup?))
                                  :channel/email first))]
                  (is (= {:recipients   #{"crowberto@metabase.com"}
                          :message-type :attachments
                          :subject      expected-subject
                          :message      [(zipmap (map str regexes) (repeat true))]}
                         (apply mt/summarize-multipart-single-email email regexes)))))]
    (testing "sent from invite page"
      (check false
             "You're invited to join Metabase Test's Metabase"
             [#"Crowberto's happiness and productivity over time"
              #"Ngoc wants you to join them on Metabase"
              #"<a[^>]*href=\"https?://metabase\.com/auth/reset_password/.*#new\"[^>]*>Join now</a>"])

      (testing "with sso enabled"
        (with-redefs [public-settings/sso-enabled? (constantly true)
                      public-settings/enable-password-login (constantly false)]
          (check false
                 "You're invited to join Metabase Test's Metabase"
                 [#"<a[^>]*href=\"https?://metabase\.com/auth/login\"[^>]*>Join now</a>"]))))

    (testing "subject is translated"
      (mt/with-mock-i18n-bundles! {"es" {:messages {"You''re invited to join {0}''s {1}"
                                                    "Estás invitado a unirte al {0} de {1}"}}}
        (mt/with-temporary-setting-values [site-locale "es"]
          (check false "Estás invitado a unirte al Metabase Test de Metabase" []))))

    (testing "sent from setup page"
      (check true
             "You're invited to join Metabase Test's Metabase"
             [#"Crowberto's happiness and productivity over time"
              #"Ngoc could use your help setting up Metabase"
              #"<a[^>]*href=\"https?://metabase\.com/auth/reset_password/.*#new\"[^>]*>"]))))
