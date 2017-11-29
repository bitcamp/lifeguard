// @flow

type Topic = {
    value: string,
    creator: string,
    last_set: boolean,
};

type Purpose = {
    value: string,
    creator: string,
    last_set: boolean,
};

type Group = {
    id: string,
    name: string,
    is_group: string,
    created: number,
    creator: string,
    is_archived: boolean,
    is_mpim: boolean,
    members: Array<string>,
    last_read: string,
    latest: ?any,
    purpose: Purpose,
    topic: Topic,
    unread_count: number,
    unread_count_display: number,
};

export type GroupResponse = {
    ok: boolean,
    group: Group,
}


type Profile = {
    avatar_hash: string,
    status_text: string,
    status_emoji: string,
    real_name: string,
    display_name: ?string,
    real_name_normalized: string,
    display_name_normalized: ?string,
    email: ?string,
    image_24: ?string,
    image_32: ?string,
    image_48: ?string,
    image_72: ?string,
    image_192: ?string,
    image_512: ?string,
    team: string,
};

type User = {
    id: string,
    team_id: string,
    name: string,
    deleted: boolean,
    color: string,
    real_name: string,
    tz: ?string,
    tz_label: ?string,
    tz_offset: ?number,
    profile: Profile,
    is_admin: boolean,
    is_owner: boolean,
    is_primary_owner: boolean,
    is_restricted: boolean,
    is_ultra_restricted: boolean,
    is_bot: boolean,
    is_stranger: boolean,
    updated: number,
    is_app_user: boolean,
    has_2fa: boolean,
    locale: ?string,
}

export type UserResponse = {
    ok: boolean,
    user: User,
};

export type UsersListResponse = {
    ok: boolean,
    members: Array<User>,
    cache_ts: number,
    response_metadata: ?{
        "next_cursor": ?string,
    },
}
